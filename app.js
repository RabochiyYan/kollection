'use strict';

const { graph, cards, intro, endings, identity, outro, history, help } = window.STORY;
const app = document.querySelector('#app');
const storageKey = 'travel-quest-v1';
const title = 'Коллекция';
const cities = {
  spb: { name:'Санкт-Петербург', country:'Россия', image:'ab00e', stops:[1,2], map:'0% 0%' },
  sam: { name:'Самарканд', country:'Узбекистан', image:'2f59b', hero:'18ded', stops:[8,9,10,11], map:'100% 100%' },
  tas: { name:'Ташкент', country:'Узбекистан', image:'54609', stops:[5,6,7], map:'0% 100%' },
  msk: { name:'Москва', country:'Россия', image:'da309', stops:[3,4], map:'100% 0%' }
};
const stops = {
  1:['Дом эмира Бухарского','Ленинград · 1959','b8237'],
  2:['Соборная мечеть','Ленинград · 1959','3223c'],
  3:['Павильон Узбекской ССР на ВДНХ','Москва · 1961',null,'vdnh'],
  4:['Ресторан «Узбекистан»','Москва · 1961',null,'restaurant'],
  5:['Базар Чорсу','Ташкент · Начало 1960-х','48ed4'],
  6:['Дворец великого князя Николая Константиновича','Ташкент · Начало 1960-х',null,'palace'],
  7:['Хазрати Имам','Ташкент',null,'imam'],
  8:['Площадь Регистан','Самарканд','548d5'],
  9:['Мавзолей Гур-Эмир','Самарканд · 1942','9b72e'],
  10:['Некрополь Шахи-Зинда','Самарканд · Воспоминание','6ac03'],
  11:['Двор с хлопком','Самарканд','40015']
};
const endingNames = { museum:'Музей', exhibit:'Выставка', quiet:'Почти ничего' };
const docsNames = { none:'Не получены', partial:'Неполный комплект', full:'Полный комплект' };
const artifacts = Object.keys(cards).filter(key => key !== 'partial' && key !== 'full');
const cast = {
  'Жительница':'resident', 'Служитель':'caretaker', 'Толя':'tolya',
  'Лёва':'leva', 'Чиновник':'official', 'Официант':'waiter',
  'Продавщица':'seller', 'Хозяин лавки':'shopkeeper', 'Знаток':'guide',
  'Руководитель':'teacher', 'Пионер':'sasha', 'Саша':'sasha',
  'Старый художник':'artist', 'Торговец':'trader', 'Мальчик':'boy',
  'Фальк':'falk', 'Вдова':'widow'
};
const parents = Object.fromEntries(Object.entries(graph).flatMap(([key, node]) =>
  node.choices.map(choice => [choice.to, key])));
const newGame = () => ({ started:false, visits:{}, scene:null, ending:null });
let game = loadGame();
let screen = { name:'cover' };

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.visits) return saved;
  } catch {}
  return newGame();
}

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(game)); } catch {}
}

function documentStatus() { return game.visits[3]?.flags.documents ?? 'none'; }
function earned() { return new Set(Object.values(game.visits).map(visit => visit.award).filter(Boolean)); }
function completed() { return Object.keys(game.visits).length; }
function collectionCount() { const found = earned(); return artifacts.filter(key => found.has(key)).length; }
function endingFor(count, documents) {
  if (count >= 8 && documents === 'full') return 'museum';
  if (count >= (documents === 'none' ? 6 : 4)) return 'exhibit';
  return 'quiet';
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const fig = name => 'assets/figma/' + name + '.png';
const bg = name => 'assets/story/' + name + '.jpg';
const coverPhoto = name => 'assets/covers/' + name + '.jpg';
const icon = (file, alt = '') => `<img class="icon" src="assets/figma/${file}.svg" alt="${alt}">`;
const button = (label, action, kind = 'primary', attrs = '') =>
  `<button type="button" class="btn ${kind}" data-action="${action}" ${attrs}>${escapeHtml(label)}</button>`;
const image = (src, className = '') => `<img class="${className}" src="${src}" alt="">`;
const text = value => `<p>${escapeHtml(value)}</p>`;
const artifactImage = (key, cls = 'artifact-image') => image('assets/items/' + key + '.png', cls);
function header(back) {
  return `<header class="topbar"><button class="round" type="button" data-action="${back}" aria-label="Назад">${icon('2f145')}</button><span>${title}</span></header>`;
}
function stage(background, body, className = '') {
  return `<section class="stage ${className}" style="--scene:url('${bg(background)}')">${body}</section>`;
}
function go(name, extra = {}) {
  screen = { name, ...extra };
  render();
  window.scrollTo(0, 0);
  app.focus({ preventScroll:true });
}

function cover() {
  return stage('cover', `<div class="cover-heading"><span class="eyebrow">Россия · Узбекистан</span><h1>${title}</h1><p>Интерактивное путешествие</p></div>
    <div class="cover-actions">${button(game.started ? 'Продолжить' : 'Начать путешествие','start')}
    ${game.started || screen.confirm ? (screen.confirm
      ? `<p>Начать сначала и удалить сохранённое прохождение?</p>${button('Начать заново','reset','secondary')}${button('Отмена','cover','ghost')}`
      : button('Начать заново','confirm','ghost')) : ''}</div>`, 'cover');
}
function exposition() {
  return `<section class="paper">${header('cover')}${image(bg('registan'),'banner')}
    <div class="pad"><p class="eyebrow">Пролог</p><h1>Вступление</h1>${intro.slice(0,2).map(row=>text(row.text)).join('')}</div>
    ${image(bg('emir-house'),'banner')}
    <div class="pad">${intro.slice(2).map(row=>text(row.text)).join('')}</div>
    ${image(bg('chorsu'),'banner')}
    <div class="pad"><p class="callout">Вы коллекционер. Выбирайте локации, говорите с людьми, принимайте решения. От того, как вы поступите, зависит, сможете ли вы собрать артефакты и открыть музей.</p>${button('Выбрать город','begin')}</div>
    </section>`;
}
function hub() {
  return `<section class="paper hub">${header('intro')}<div class="pad">
    <h1>Выбери город</h1><p>Четыре города. Одна история. С чего начнётся твоё путешествие?</p>
    <div class="cities">${Object.entries(cities).map(([id,city])=>`<button class="city-card" data-action="city:${id}">
      ${image(fig(city.image))}<strong>${city.name}</strong><small>${city.stops.filter(n=>game.visits[n]).length} из ${city.stops.length} локаций</small></button>`).join('')}</div>
    <aside class="callout">${icon('ae2e3')} <strong>Маршрут</strong><p>Начни в любом городе. Финал откроется после восьми завершённых локаций.</p></aside>
    <div class="hub-tools">${button('Справка','help','secondary')}${button('Артефакты','inventory','secondary')}</div>
    <button class="btn final-link" data-action="summary" ${completed()<8?'disabled':''}><span>Финал</span><span>Локации ${completed()}/11</span></button>
    <p class="hub-progress"><strong>Артефакты ${collectionCount()}/10</strong><span>Документы · ${docsNames[documentStatus()]}</span></p>
    </div></section>`;
}
function cityPage() {
  const city = cities[screen.city];
  const count = city.stops.filter(n=>game.visits[n]).length;
  return `<section class="paper">${header('hub')}<div class="pad city-title"><h1>${city.name}</h1><p>${city.country}</p></div>
    ${image(fig(city.hero || city.image),'banner')}
    <div class="pad"><p class="eyebrow">Локации · ${count}/${city.stops.length}</p>
    <div class="stop-list">${city.stops.map(n=>{
      const [name, time, photo, cover] = stops[n];
      const locked = n===4 && !game.visits[3];
      const done = Boolean(game.visits[n]);
      const status = locked ? 'После ВДНХ' : done ? icon('87480')+' Пройдено' : escapeHtml(time);
      return `<button class="stop-card ${done?'done':''}" data-action="stop:${n}" ${locked?'disabled':''}>
        ${image(cover ? coverPhoto(cover) : fig(photo))}<span><strong>${name}</strong><small>${status}</small></span></button>`;
    }).join('')}</div></div>
    ${city.map ? `<div class="map" role="img" aria-label="Карта города ${city.name}" style="--position:${city.map}"></div>` : ''}
    </section>`;
}
function cityFor(n) { return Object.keys(cities).find(key => cities[key].stops.includes(n)); }

function startScene(stop) {
  if (stop === 4 && !game.visits[3]) return;
  if (game.scene?.stop !== stop) {
    const key = stop === 4 ? ({none:'4a',partial:'4b',full:'4c'})[documentStatus()] : String(stop);
    game.scene = { stop, key, index:0 };
    save();
  }
  go('scene');
}

function scenePage() {
  const { stop, key, index } = game.scene;
  const node = graph[key];
  const row = node.pages[index];
  const choosing = index === node.pages.length && node.choices.length;
  const reward = index === node.pages.length && node.award;
  const speaker = row?.speaker || '';
  const isHero = speaker.startsWith('Герой');
  let portrait = cast[speaker];
  if (speaker === 'Женщина') portrait = stop===11 ? 'cotton-worker' : 'bracelet-owner';
  if (isHero) portrait = 'hero';
  const sceneBg = choosing && stop===11 ? '11-choice' : choosing && stop===2 ? '2-rain' : ((row ? row.bg : node.pages.at(-1)?.bg) || stop);
  const room = stop===4 && index===0 && key.length===2;
  return stage(room ? '4' : sceneBg, `
    <div class="scene-top"><button type="button" class="round" data-action="leave" aria-label="Назад к локациям">${icon('2f145')}</button>
    <span>${stops[stop][0]}</span></div>
    ${portrait ? image('assets/people/' + portrait + '.png', isHero ? 'portrait portrait-hero' : 'portrait') : ''}
    <div class="scene-bottom">
      ${reward ? `<div class="dialog reward">${artifactImage(reward)}<span class="eyebrow">Получено</span><h2>${cards[reward].title}</h2>
        <p>${escapeHtml(cards[reward].text.split('\n')[0])}</p></div>${button('Вернуться к локациям','finish','gold')}` : ''}
      ${choosing ? `<div class="dialog"><span class="eyebrow">Твой выбор</span><div class="choices">${node.choices.map((choice,i)=>button(choice.label,'choose:'+i,'choice')).join('')}</div></div>` : ''}
      ${row ? `<div class="dialog ${speaker?'':'narration'}">${speaker ? `<strong>${escapeHtml(speaker)}</strong>` : ''}${text(row.text)}</div>
        ${button(index===node.pages.length-1 && !node.choices.length && !node.award ? 'Завершить локацию' : 'Далее','next','gold')}` : ''}
      ${index > 0 || parents[key] ? button('← Предыдущая реплика','previous','ghost') : ''}
    </div>`, 'novel');
}
function previousScene() {
  const scene = game.scene;
  if (scene.index > 0) {
    scene.index -= 1;
  } else if (parents[scene.key]) {
    scene.key = parents[scene.key];
    scene.index = graph[scene.key].pages.length - 1;
  }
  save();
  go('scene');
}
function finishScene() {
  const { stop, key } = game.scene;
  const node = graph[key];
  const previousDocs = documentStatus();
  game.visits[stop] = { award:node.award || '', flags:node.flags || {} };
  if (stop===3 && previousDocs!==documentStatus()) delete game.visits[4];
  game.scene = null;
  game.ending = null;
  save();
  go('city',{city:cityFor(stop)});
}
function nextScene() {
  const node = graph[game.scene.key];
  if (game.scene.index+1 === node.pages.length && !node.choices.length && !node.award) return finishScene();
  game.scene.index += 1;
  save();
  go('scene');
}

function inventory() {
  const found = earned();
  const doc = documentStatus();
  const itemButton = key => `<button class="item" data-action="item:${key}">${artifactImage(key)}<strong>${cards[key].title}</strong></button>`;
  return `<section class="paper">${header('hub')}${image(coverPhoto('items'),'banner')}<div class="pad"><h1>Артефакты</h1>
    <p>В коллекции ${collectionCount()} из 10 предметов</p>
    <div class="collection">${artifacts.map(key=>found.has(key)
      ? itemButton(key)
      : `<div class="item empty"><span aria-hidden="true">◇</span><small>Не найдено</small></div>`).join('')}</div>
    <section class="documents"><h2>Документы</h2>${doc==='none' ? text('Пока не получены') : itemButton(doc)}</section>
    </div></section>`;
}
function item() {
  const card = cards[screen.key];
  return `<section class="paper">${header('inventory')}<article class="pad item-detail">
    ${artifactImage(screen.key)}<p class="eyebrow">${['full','partial'].includes(screen.key)?'Документы':'Артефакт'}</p>
    <h1>${card.title}</h1><div class="article">${escapeHtml(card.text)}</div>
    </article></section>`;
}
function helpEntries(entries) {
  return entries.map(({title, paragraphs}) => `<details class="help-entry">
    <summary>${escapeHtml(title)}</summary>
    <div class="help-definition">${paragraphs.map(text).join('')}</div>
  </details>`).join('');
}

function helpSection({title, entries, subsections = []}, heading = 'h2') {
  const subheading = heading === 'h2' ? 'h3' : 'h4';
  return `<section class="help-section"><${heading}>${escapeHtml(title)}</${heading}>
    ${helpEntries(entries)}
    ${subsections.map(subsection => `<${subheading}>${escapeHtml(subsection.title)}</${subheading}>
      ${helpEntries(subsection.entries)}`).join('')}
  </section>`;
}

function helpPage() {
  const overview = help.filter(section => !section.group);
  const glossary = help.filter(section => section.group === 'Глоссарий');
  return `<section class="paper">${header('hub')}${image(coverPhoto('help'),'banner')}
    <article class="pad help-page"><h1>Справка</h1>
      <p>Нажми на название или термин, чтобы прочитать описание.</p>
      ${overview.map(section => helpSection(section)).join('')}
      <section class="help-glossary" aria-labelledby="glossary-heading">
        <h2 id="glossary-heading">Глоссарий</h2>
        ${glossary.map(section => helpSection(section,'h3')).join('')}
      </section>
    </article></section>`;
}

function summary() {
  const found = earned();
  return stage('summary', `<div class="scene-top"><button type="button" class="round" data-action="hub" aria-label="К городам">${icon('2f145')}</button></div>
    <div class="scene-bottom"><div class="dialog"><p class="eyebrow">Итоги маршрута</p><h1>Коллекция</h1>
    <p>Предметы · <strong>${collectionCount()}/10</strong><br>Локации · <strong>${completed()}/11</strong><br>Документы · ${docsNames[documentStatus()]}</p>
    <div class="summary-grid">${artifacts.map(key=>`<span title="${found.has(key)?cards[key].title:'Не найдено'}">${found.has(key)?artifactImage(key):'◇'}</span>`).join('')}</div></div>
    ${button('Узнать итог','ending','gold')}</div>`, 'novel');
}
function ending() {
  const key = endingFor(collectionCount(), documentStatus());
  const found = earned();
  const flags = Object.assign({},...Object.values(game.visits).map(visit=>visit.flags));
  const conditions = {
    full:documentStatus()==='full', partial:documentStatus()==='partial', none:documentStatus()==='none',
    promise:flags.bracelet==='promise', pressure:flags.bracelet==='pressure', receipt:flags.receipt,
    sketch:flags.sketch && !found.has('bracelet'), recipe:found.has('recipe'),
    noRecipe:game.visits[4] && !found.has('recipe'), noStudio:game.visits[6] && !found.has('studio')
  };
  const people = [
    [found.has('pendant'),'Жительница ленинградского дома открыла вам дверь.'],
    [flags.seller,'Продавщица на базаре поделилась советом.'],
    [flags.receipt,'Кто-то показал работу, которую давно не выставляли.'],
    [flags.bracelet==='promise','Кто-то расстался с предметом, который хранил десятилетиями.']
  ].filter(([show])=>show).map(([,sentence])=>sentence).join(' ');
  const rows = endings[key].flatMap(row=>row.when==='museumPeople' ? (people?[{text:people}]:[])
    : (!row.when || conditions[row.when] ? [row] : []));
  return stage(key,`<article class="ending-content"><div class="dialog">
    <span class="eyebrow">Финал маршрута</span><h1>${endingNames[key]}</h1>
    ${rows.map(row=>text(row.text)).join('')}<details><summary>Историческая справка</summary>${text(history)}</details>
    </div>${button('Узнать, кто герой','identity','gold')}</article>`, 'ending');
}
function epilogue(background, name, rows, label, action) {
  return stage(background, `<article class="ending-content"><div class="dialog"><h1>${name}</h1>
    ${rows.map(row=>text(row.text)).join('')}</div>${button(label,action,'gold')}</article>`, 'ending');
}

function render() {
  const pages = {
    cover, intro:exposition, hub, city:cityPage, scene:scenePage, inventory, item, help:helpPage, summary, ending,
    identity:()=>epilogue('identity','Кто наш герой?',identity,'Далее','outro'),
    outro:()=>epilogue('outro','Четыре города, одна история',outro,'Вернуться к городам','hub')
  };
  app.innerHTML = pages[screen.name]();
}

app.addEventListener('click', event => {
  const target = event.target.closest('button[data-action]');
  if (!target) return;
  const [action,value] = target.dataset.action.split(':');
  switch (action) {
    case 'start':
      return game.ending ? go(game.ending) : go(game.scene ? 'scene' : game.started ? 'hub' : 'intro');
    case 'begin':
      game.started = true; save(); return go('hub');
    case 'confirm': return go('cover',{confirm:true});
    case 'reset':
      game = newGame(); save(); return go('intro');
    case 'hub':
      game.ending = null; save(); return go('hub');
    case 'city': return go('city',{city:value});
    case 'stop': return startScene(Number(value));
    case 'leave': return go('city',{city:cityFor(game.scene.stop)});
    case 'next': return nextScene();
    case 'previous': return previousScene();
    case 'choose': {
      const choice = graph[game.scene.key].choices[Number(value)];
      game.scene.key = choice.to; game.scene.index = 0; save();
      return go('scene');
    }
    case 'finish': return finishScene();
    case 'item': return go('item',{key:value});
    case 'summary': return completed()>=8 && go('summary');
    case 'ending': case 'identity': case 'outro':
      game.ending = action; save(); return go(action);
    default: return go(action);
  }
});

render();
