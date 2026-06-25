const express = require('express');

const drinkModel = require('../models/drinkModel');
const cache = require('../config/cache');
const { publish } = require('../config/redis');
const logger = require('../config/logger');

// Controladores ficam direto neste arquivo de rota (sem pasta controllers/).
const router = express.Router();

// Canais da fila Pub/Sub consumidos pelo notification-service.
const CHANNELS = {
  created: 'recurso.criado',
  updated: 'recurso.atualizado',
  deleted: 'recurso.excluido',
};

// ---- Sanitizacao / validacao -------------------------------------------------

// Remove < e > para mitigar XSS armazenado e limita o tamanho do campo.
function sanitizeText(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

// So aceita URLs http/https (descarta javascript:, data:, etc.).
function sanitizeUrl(value) {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v.slice(0, 500) : '';
}

// Monta um drink saneado a partir do corpo e retorna eventuais erros de validacao.
function parseDrinkBody(body = {}) {
  const data = {
    name: sanitizeText(body.name, 120),
    category: sanitizeText(body.category, 80),
    instructions: sanitizeText(body.instructions, 2000),
    ingredients: sanitizeText(body.ingredients, 1000),
    image_url: sanitizeUrl(body.image_url),
  };

  const errors = [];
  if (!data.name) errors.push('O campo "name" e obrigatorio.');
  if (body.image_url && !data.image_url) {
    errors.push('O campo "image_url" deve ser uma URL http(s) valida.');
  }
  return { data, errors };
}

// Valida que o :id da rota e um inteiro positivo.
function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ---- RF2: Busca/Listagem (Read) ---------------------------------------------
router.get('/', (req, res) => {
  const search =
    typeof req.query.search === 'string'
      ? req.query.search.trim().slice(0, 120)
      : '';

  const cacheKey = `list:${search}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ drinks: cached, cached: true });
  }

  const drinks = drinkModel.list(search);
  cache.set(cacheKey, drinks);
  logger.info('Busca de drinks', { search, total: drinks.length });
  res.json({ drinks, cached: false });
});

// GET /:id -> detalhe de um drink
router.get('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalido.' });

  const drink = drinkModel.getById(id);
  if (!drink) return res.status(404).json({ error: 'Drink nao encontrado.' });
  res.json({ drink });
});

// ---- RF3: Insercao (Create) --------------------------------------------------
router.post('/', async (req, res) => {
  const { data, errors } = parseDrinkBody(req.body);
  if (errors.length) {
    logger.warn('Criacao rejeitada por validacao', { errors });
    return res.status(400).json({ errors });
  }

  // Vincula o drink ao usuario autenticado (dono do registro).
  const drink = drinkModel.create({ ...data, user_id: req.user.id });
  cache.clear(); // invalida cache apos escrita

  await publish(CHANNELS.created, {
    evento: CHANNELS.created,
    drink,
    autor: req.user.username,
  });

  logger.info('Drink criado', { id: drink.id, userId: req.user.id });
  res.status(201).json({ drink });
});

// ---- RF4: Atualizacao (Update) ----------------------------------------------
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalido.' });

  const existing = drinkModel.getById(id);
  if (!existing) return res.status(404).json({ error: 'Drink nao encontrado.' });

  // Verificacao de propriedade no servidor (RNF seguranca) -> 403 se nao for dono.
  if (existing.user_id !== req.user.id) {
    logger.warn('Update negado: usuario nao e o dono', {
      drinkId: id,
      owner: existing.user_id,
      requester: req.user.id,
    });
    return res
      .status(403)
      .json({ error: 'Voce nao tem permissao para editar este drink.' });
  }

  const { data, errors } = parseDrinkBody(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const drink = drinkModel.update({ ...data, id });
  cache.clear();

  await publish(CHANNELS.updated, {
    evento: CHANNELS.updated,
    drink,
    autor: req.user.username,
  });

  logger.info('Drink atualizado', { id, userId: req.user.id });
  res.json({ drink });
});

// ---- RF5: Exclusao (Delete) -------------------------------------------------
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalido.' });

  const existing = drinkModel.getById(id);
  if (!existing) return res.status(404).json({ error: 'Drink nao encontrado.' });

  if (existing.user_id !== req.user.id) {
    logger.warn('Delete negado: usuario nao e o dono', {
      drinkId: id,
      owner: existing.user_id,
      requester: req.user.id,
    });
    return res
      .status(403)
      .json({ error: 'Voce nao tem permissao para excluir este drink.' });
  }

  drinkModel.remove(id);
  cache.clear();

  await publish(CHANNELS.deleted, {
    evento: CHANNELS.deleted,
    drink: { id },
    autor: req.user.username,
  });

  logger.info('Drink excluido', { id, userId: req.user.id });
  res.status(200).json({ message: 'Drink excluido com sucesso.', id });
});

module.exports = router;
