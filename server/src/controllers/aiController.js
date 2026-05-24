import { generateAttributes, generateStory } from '../services/aiService.js';

export async function attributes(req, res, next) {
  const body = req.body || {};
  const messages = body.messages;
  console.log('[AI] POST /api/ai/attributes', {
    race: body.race,
    className: body.className,
    messagesCount: Array.isArray(messages) ? messages.length : 0,
    hasPlayStylePrompt: Boolean(String(body.playStylePrompt || '').trim()),
  });

  try {
    const { race, className, playStylePrompt, messages: msgs, gender } = body;
    const result = await generateAttributes({
      race: race || '',
      className: className || '',
      playStylePrompt: playStylePrompt || '',
      messages: Array.isArray(msgs) ? msgs : [],
      gender: gender || 'unknown',
    });
    console.log('[AI] POST /api/ai/attributes OK');
    res.json(result);
  } catch (e) {
    console.error('[AI] POST /api/ai/attributes error:', e?.code || e?.name, e?.message);
    next(e);
  }
}

export async function story(req, res, next) {
  try {
    const { race, className, gender, attributes, playStylePrompt, storyPrompt, chatSummary } = req.body || {};
    console.log('[AI] POST /api/ai/story', { race, className, hasAttributes: Boolean(attributes) });
    const result = await generateStory({
      race: race || '',
      className: className || '',
      gender: gender || 'unknown',
      attributes: attributes || null,
      playStylePrompt: playStylePrompt || '',
      storyPrompt: storyPrompt || '',
      chatSummary: chatSummary || '',
    });
    console.log('[AI] POST /api/ai/story OK');
    res.json(result);
  } catch (e) {
    console.error('[AI] POST /api/ai/story error:', e?.code || e?.name, e?.message);
    next(e);
  }
}

