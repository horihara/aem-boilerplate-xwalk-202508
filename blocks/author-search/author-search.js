/**
 * Author Search block
 *
 * Loads authors from the AEM GraphQL persisted query and renders cards.
 * The authored block fields are read in this order:
 *   1. title
 *   2. tagKeyword
 */

const GRAPHQL_QUERY_BASE = 'https://publish-p139028-e1411475.adobeaemcloud.com/graphql/execute.json/horihara-universal-editor-xwalk-202508/AuthorInfoByJobtitleTag';
const CF_FOLDER_PATH = '/content/dam/horihara-universal-editor-xwalk-202508/cf/';
const DEFAULT_TITLE = '著者検索';
const DEFAULT_TAG = 'field-engineer';

function readAuthoredValues(block) {
  // XWalk block fields are rendered as rows. For each row, the second column
  // contains the authored value. The fallback also handles a simple one-column
  // structure during local development.
  return [...block.children].map((row) => {
    const columns = [...row.children];
    if (columns.length > 1) return columns[1].textContent.trim();
    return row.textContent.trim();
  });
}

function buildQueryUrl(tagKeyword) {
  const params = [
    `folderPath=${encodeURIComponent(CF_FOLDER_PATH)}`,
    `jobtitleTag=${encodeURIComponent(tagKeyword)}`,
  ].join(';');
  return `${GRAPHQL_QUERY_BASE};${params}`;
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function safeTel(value) {
  return String(value ?? '').replace(/[^0-9+]/g, '');
}

function makeField(label, value, { href, className } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `author-search__field ${className || ''}`.trim();

  const labelElement = document.createElement('dt');
  labelElement.className = 'author-search__label';
  labelElement.textContent = label;

  const valueElement = href ? document.createElement('a') : document.createElement('dd');
  valueElement.className = 'author-search__value';
  valueElement.textContent = value || '—';
  if (href && value) {
    valueElement.href = href;
  }

  wrapper.append(labelElement, valueElement);
  return wrapper;
}

function makeAuthorCard(author) {
  const card = document.createElement('article');
  card.className = 'author-search__card';

  const name = document.createElement('h3');
  name.className = 'author-search__name';
  name.textContent = normalizeText(author.name) || '氏名未設定';

  const details = document.createElement('dl');
  details.className = 'author-search__details';
  details.append(
    makeField('役職', normalizeText(author.jobtitle?.plaintext)),
    makeField('メール', normalizeText(author.email), {
      href: author.email ? `mailto:${author.email}` : undefined,
      className: 'author-search__field--email',
    }),
    makeField('電話', normalizeText(author.tel), {
      href: author.tel ? `tel:${safeTel(author.tel)}` : undefined,
      className: 'author-search__field--tel',
    }),
  );

  card.append(name, details);
  return card;
}

function setStatus(element, message, type = '') {
  element.textContent = message;
  element.className = `author-search__status ${type ? `author-search__status--${type}` : ''}`.trim();
}

async function fetchAuthors(tagKeyword) {
  const response = await fetch(buildQueryUrl(tagKeyword), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  return payload.data?.edsDemoAuthorInfoList?.items || [];
}

function renderResults(results, resultsContainer, statusElement) {
  resultsContainer.replaceChildren();
  const count = results.length;
  setStatus(statusElement, `${count}件の著者が見つかりました。`, count ? 'success' : 'empty');

  if (!count) {
    const empty = document.createElement('p');
    empty.className = 'author-search__empty';
    empty.textContent = '該当する著者が見つかりませんでした。';
    resultsContainer.append(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'author-search__list';
  results.forEach((author) => list.append(makeAuthorCard(author)));
  resultsContainer.append(list);
}

export default async function decorate(block) {
  const [authoredTitle, authoredTag] = readAuthoredValues(block);
  const title = authoredTitle || DEFAULT_TITLE;
  const initialTag = authoredTag || DEFAULT_TAG;

  const heading = document.createElement('h2');
  heading.className = 'author-search__heading';
  heading.textContent = title;

  const form = document.createElement('form');
  form.className = 'author-search__form';
  form.noValidate = true;

  const label = document.createElement('label');
  label.className = 'author-search__input-label';
  label.htmlFor = `author-search-tag-${Math.random().toString(36).slice(2)}`;
  label.textContent = '役職タグ';

  const input = document.createElement('input');
  input.id = label.htmlFor;
  input.className = 'author-search__input';
  input.name = 'jobtitleTag';
  input.type = 'search';
  input.value = initialTag;
  input.placeholder = '例: field-engineer';
  input.autocomplete = 'off';
  input.required = true;

  const button = document.createElement('button');
  button.className = 'author-search__button';
  button.type = 'submit';
  button.textContent = '検索';

  const status = document.createElement('p');
  status.className = 'author-search__status';
  status.setAttribute('aria-live', 'polite');

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'author-search__results';

  form.append(label, input, button);
  block.replaceChildren(heading, form, status, resultsContainer);

  const search = async (tagKeyword) => {
    const keyword = tagKeyword.trim();
    if (!keyword) {
      setStatus(status, '検索タグを入力してください。', 'error');
      resultsContainer.replaceChildren();
      input.focus();
      return;
    }

    button.disabled = true;
    setStatus(status, '検索中…');
    resultsContainer.replaceChildren();

    try {
      const results = await fetchAuthors(keyword);
      renderResults(results, resultsContainer, status);
    } catch (error) {
      // Do not expose the full URL or internal details to visitors.
      console.error('[author-search]', error);
      setStatus(status, '検索に失敗しました。時間をおいて再度お試しください。', 'error');
    } finally {
      button.disabled = false;
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    search(input.value);
  });

  // Automatically show the configured initial tag in preview and on the live page.
  await search(initialTag);
}
