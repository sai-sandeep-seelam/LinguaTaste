import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ENTITY_TYPES,
  LANGUAGE_COUNTRIES,
  searchEntities,
  getInsights,
  getTasteProfile,
  getQlooApiKey,
  getQlooBaseUrl,
  setRuntimeQlooConfig,
  clearQlooCache,
} from '../qloo.ts';

describe('Qloo URN Taxonomy & Language Configuration', () => {
  it('maps standard media types to official Qloo entity URNs', () => {
    assert.equal(ENTITY_TYPES.movie, 'urn:entity:movie');
    assert.equal(ENTITY_TYPES.tv, 'urn:entity:tv_show');
    assert.equal(ENTITY_TYPES.music, 'urn:entity:artist');
    assert.equal(ENTITY_TYPES.book, 'urn:entity:book');
    assert.equal(ENTITY_TYPES.podcast, 'urn:entity:podcast');
  });

  it('maps major target languages to authentic origin countries', () => {
    assert.deepEqual(LANGUAGE_COUNTRIES['japanese'].countries, ['JP']);
    assert.ok(LANGUAGE_COUNTRIES['spanish'].countries.includes('ES'));
    assert.ok(LANGUAGE_COUNTRIES['spanish'].countries.includes('MX'));
    assert.ok(LANGUAGE_COUNTRIES['french'].countries.includes('FR'));
    assert.ok(LANGUAGE_COUNTRIES['korean'].countries.includes('KR'));
    assert.ok(LANGUAGE_COUNTRIES['german'].countries.includes('DE'));
  });
});

describe('Qloo Runtime Configuration & Cache', () => {
  it('updates runtime API key and base URL dynamically', () => {
    setRuntimeQlooConfig('test-key-12345', 'https://api.qloo.com');
    assert.equal(getQlooApiKey(), 'test-key-12345');
    assert.equal(getQlooBaseUrl(), 'https://api.qloo.com');

    // Reset back
    setRuntimeQlooConfig('', 'https://hackathon.api.qloo.com');
    clearQlooCache();
  });
});

describe('Qloo Entity Search Handling', () => {
  it('returns empty array when query is empty or whitespace', async () => {
    const res = await searchEntities('   ');
    assert.equal(res.entities.length, 0);
    assert.equal(res.total, 0);
  });

  it('resolves curated entities with valid IDs and names in offline/simulation mode', async () => {
    const res = await searchEntities('Radiohead');
    assert.ok(res.entities.length > 0);
    assert.equal(res.entities[0].name, 'Radiohead');
    assert.equal(res.entities[0].type, 'urn:entity:artist');
    assert.ok(res.entities[0].id.length > 0);
  });

  it('handles unknown entity queries by generating valid structured candidate', async () => {
    const res = await searchEntities('UniqueIndieProjectXYZ');
    assert.ok(Array.isArray(res.entities));
    if (res.source === 'simulated') {
      assert.ok(res.entities.length > 0);
      assert.equal(res.entities[0].name, 'UniqueIndieProjectXYZ');
      assert.ok(res.entities[0].id.startsWith('ent_'));
    }
  });
});

describe('Qloo Insights & Taste Graph', () => {
  it('returns empty results when no entity IDs are passed', async () => {
    const res = await getInsights({
      entityIds: [],
      filterType: ENTITY_TYPES.movie,
    });
    assert.equal(res.results.length, 0);
  });

  it('filters out undefined or malformed entity IDs', async () => {
    const res = await getInsights({
      entityIds: ['', '   ', 'undefined'],
      filterType: ENTITY_TYPES.movie,
    });
    assert.equal(res.results.length, 0);
  });

  it('returns structured recommendations with affinity and tags when given valid seeds', async () => {
    const res = await getInsights({
      entityIds: ['ent_radiohead'],
      filterType: ENTITY_TYPES.music,
    });

    assert.ok(res.results.length > 0);
    const first = res.results[0];
    assert.ok(first.entity.name.length > 0);
    assert.ok(typeof first.affinity === 'number');
    assert.ok(first.affinity! >= 0 && first.affinity! <= 1);
  });

  it('builds a multi-tag taste profile from seed entity IDs', async () => {
    const profile = await getTasteProfile(['ent_radiohead', 'ent_deathnote']);
    assert.ok(profile.topTags.length > 0);
    assert.ok(profile.summary.length > 0);
    assert.ok(profile.topTags[0].affinity > 0);
  });
});
