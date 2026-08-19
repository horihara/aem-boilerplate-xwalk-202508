/**
 * Author Search block
 *
 * Loads authors from the AEM GraphQL persisted query and renders cards.
 * The authored block fields are read in this order:
 *   1. title
 *   2. tagKeyword
 */

const GRAPHQL_QUERY_BASE = 'https://author-p139028-e1411475.adobeaemcloud.com/graphql/execute.json/horihara-universal-editor-xwalk-202508/AuthorInfoByJobtitleTag';
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
    `folderPath=${CF_FOLDER_PATH}`,
    `jobtitleTag=${tagKeyword}`,
  ].join(';');
  // Persisted Query の変数部分全体をエンコードする
  return `${GRAPHQL_QUERY_BASE}${encodeURIComponent(`;${params}`)}`;
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
/**
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
**/

async function fetchAuthors(tagKeyword) {
  const requestUrl = buildQueryUrl(tagKeyword);
  const pageOrigin = window.location.origin;
  const requestOrigin = new URL(requestUrl, window.location.href).origin;

  console.groupCollapsed('[author-search] GraphQL request');

  console.log('Request information:', {
    tagKeyword,
    requestUrl,
    pageOrigin,
    requestOrigin,
    crossOrigin: pageOrigin !== requestOrigin,
  });

  try {
    let response;

    try {
      response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (error) {
      // CORS またはネットワークエラーの場合、
      // response を受け取る前にここへ到達します。
      console.error(
        '[author-search] fetch() failed before a readable response was received.',
        {
          name: error.name,
          message: error.message,
          requestUrl,
          pageOrigin,
          requestOrigin,
          likelyCorsIssue: pageOrigin !== requestOrigin,
        },
      );

      console.error(
        '[author-search] If the URL works directly in a browser but fetch() fails, ' +
        'check the CORS configuration on the AEM Publish environment.',
      );

      throw error;
    }

    console.log('HTTP response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
    });

    // response.json() の代わりに text() で一度受け取り、
    // JSON パース前後の状態を確認します。
    const responseBody = await response.text();

    console.log('Response body length:', responseBody.length);

    if (!response.ok) {
      console.error(
        '[author-search] HTTP error response preview:',
        responseBody.slice(0, 500),
      );

      throw new Error(`GraphQL request failed: HTTP ${response.status}`);
    }

    let payload;

    try {
      payload = JSON.parse(responseBody);
    } catch (error) {
      console.error('[author-search] Response is not valid JSON:', {
        name: error.name,
        message: error.message,
        responsePreview: responseBody.slice(0, 500),
      });

      throw new Error('GraphQL response was not valid JSON');
    }

    console.log('GraphQL response keys:', Object.keys(payload));
    console.log(
      'GraphQL error count:',
      Array.isArray(payload.errors) ? payload.errors.length : 0,
    );

    if (payload.errors?.length) {
      console.error('[author-search] GraphQL errors:', payload.errors);

      throw new Error(
        payload.errors.map((error) => error.message).join('; '),
      );
    }

    const items = payload.data?.edsDemoAuthorInfoList?.items || [];

    console.log('[author-search] Search result count:', items.length);

    // 個人情報を含む email / tel はログ出力せず、
    // 件数・氏名・パスだけを確認します。
    console.table(
      items.map((item) => ({
        name: item.name,
        path: item._path,
      })),
    );

    return items;
  } finally {
    console.groupEnd();
  }
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
