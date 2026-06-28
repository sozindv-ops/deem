'use strict';

var currentGen = null;

function init() {
  var makes = Object.keys(CARS).sort(function(a,b){return a.localeCompare(b,'ru');});
  var sel = document.getElementById('selMake');
  makes.forEach(function(m){
    var o = document.createElement('option');
    o.value = m; o.textContent = m;
    sel.appendChild(o);
  });
}

function onMakeChange() {
  var make = document.getElementById('selMake').value;
  var selModel = document.getElementById('selModel');

  selModel.innerHTML = '<option value="">— выберите модель —</option>';
  selModel.disabled = true;

  document.getElementById('genGroup').style.display = 'none';
  document.getElementById('selGen').innerHTML = '<option value="">— выберите поколение —</option>';

  document.getElementById('engGroup').style.display = 'none';
  document.getElementById('selEngine').innerHTML = '<option value="">— выберите двигатель —</option>';

  document.getElementById('mileageRow').style.display = 'none';
  document.getElementById('btnAnalyze').disabled = true;

  if (!make) return;

  var models = Object.keys(CARS[make]).sort(function(a,b){return a.localeCompare(b,'ru');});
  models.forEach(function(m){
    var o = document.createElement('option');
    o.value = m; o.textContent = m;
    selModel.appendChild(o);
  });
  selModel.disabled = false;
}

function onModelChange() {
  var make = document.getElementById('selMake').value;
  var model = document.getElementById('selModel').value;
  var selGen = document.getElementById('selGen');

  document.getElementById('genGroup').style.display = 'none';
  selGen.innerHTML = '<option value="">— выберите поколение —</option>';

  document.getElementById('engGroup').style.display = 'none';
  document.getElementById('selEngine').innerHTML = '<option value="">— выберите двигатель —</option>';

  document.getElementById('mileageRow').style.display = 'none';
  document.getElementById('btnAnalyze').disabled = true;

  if (!make || !model) return;

  var gens = CARS[make][model].gens;
  gens.forEach(function(g, i){
    var o = document.createElement('option');
    o.value = i; o.textContent = g.name;
    selGen.appendChild(o);
  });
  document.getElementById('genGroup').style.display = '';
}

function onGenChange() {
  var make = document.getElementById('selMake').value;
  var model = document.getElementById('selModel').value;
  var genIdx = document.getElementById('selGen').value;
  var selEngine = document.getElementById('selEngine');

  document.getElementById('engGroup').style.display = 'none';
  selEngine.innerHTML = '<option value="">— выберите двигатель —</option>';

  document.getElementById('mileageRow').style.display = 'none';
  document.getElementById('btnAnalyze').disabled = true;

  if (!make || !model || genIdx === '') return;

  currentGen = CARS[make][model].gens[parseInt(genIdx)];
  currentGen.engines.forEach(function(e){
    var o = document.createElement('option');
    o.value = e; o.textContent = e;
    selEngine.appendChild(o);
  });
  document.getElementById('engGroup').style.display = '';
  document.getElementById('mileageRow').style.display = '';
  document.getElementById('btnAnalyze').disabled = false;
}

function showResults() {
  if (!currentGen) return;
  var mileage = parseInt(document.getElementById('mileage').value) || 0;
  var engine = document.getElementById('selEngine').value;
  var make = document.getElementById('selMake').value;
  var model = document.getElementById('selModel').value;

  document.getElementById('resultTitle').textContent =
    make + ' ' + model + ' ' + currentGen.name + (engine ? ' • ' + engine : '');

  renderProblems(currentGen.problems);
  renderChecklist(currentGen.problems, model);
  renderPaint(currentGen.paint, make, model);
  renderMaintenance(currentGen.maint, mileage);

  document.getElementById('step1').style.display = 'none';
  var rc = document.getElementById('resultsCard');
  rc.classList.remove('hidden');
  rc.classList.add('fade-in');
  showTab('problems');
}

function renderProblems(problems) {
  var el = document.getElementById('tab-problems');
  if (!problems || problems.length === 0) {
    el.innerHTML = '<p style="color:#718096;text-align:center;padding:24px;">Серьёзных типичных проблем для данной модификации не выявлено.</p>';
    return;
  }
  var sev = {high:'Высокая', medium:'Средняя', low:'Низкая'};
  el.innerHTML = problems.map(function(p){
    return '<div class="problem-item ' + p.s + '">' +
      '<div><span class="problem-badge badge-' + p.s + '">' + sev[p.s] + '</span></div>' +
      '<div>' +
        '<div class="problem-text">' + esc(p.t) + '</div>' +
        '<div class="problem-detail">' + esc(p.d) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderChecklist(problems, model) {
  var el = document.getElementById('tab-checklist');
  var sections = [
    { name:'Кузов и ЛКП', items:[
      'Проверить кузов на следы ДТП (замятины, разная ширина зазоров)',
      'Измерить толщину ЛКП толщиномером по всем зонам',
      'Осмотреть пороги, арки, днище на предмет коррозии',
      'Проверить уплотнители дверей и стёкол',
      'Осмотреть стёкла на сколы и трещины'
    ]},
    { name:'Под капотом', items:[
      'Проверить уровни всех технических жидкостей',
      'Осмотреть патрубки на трещины и следы подтёков',
      'Проверить состояние ремней и цепей ГРМ',
      'Убедиться в отсутствии подтёков масла',
      'Осмотреть аккумулятор (дата, состояние клемм)'
    ]},
    { name:'Салон', items:[
      'Проверить работу всей электроники и климата',
      'Осмотреть обивку и проверить на неприятные запахи',
      'Проверить работу всех стеклоподъёмников',
      'Убедиться в работоспособности всех ремней безопасности',
      'Проверить пробег на соответствие состоянию педалей и руля'
    ]},
    { name:'Ходовая часть', items:[
      'Проверить люфт рулевого управления',
      'Осмотреть состояние шин (износ, однородность)',
      'Проверить тормозные диски и колодки',
      'Прослушать подвеску при езде по неровностям',
      'Проверить ШРУС на пыльники и стуки'
    ]},
    { name:'Тест-драйв', items:[
      'Проверить плавность переключения передач (МКПП/АКПП)',
      'Убедиться в отсутствии вибраций при разгоне',
      'Проверить торможение (нет уводов, вибраций на педали)',
      'Прослушать двигатель на холостых и при нагрузке',
      'Проверить работу полного привода (если есть)'
    ]}
  ];

  var attn = [];
  if (problems) {
    problems.forEach(function(p){
      if (p.s === 'high' || p.s === 'medium') attn.push(p.t + ': ' + p.d);
    });
  }

  var html = '';
  if (attn.length > 0) {
    html += '<div class="notice notice-warn" style="margin-bottom:16px;">' +
      '<strong>⚠️ Особое внимание для ' + esc(model) + ':</strong>' +
      '<ul style="margin:8px 0 0 16px;">' +
      attn.map(function(a){ return '<li>' + esc(a) + '</li>'; }).join('') +
      '</ul></div>';
  }

  sections.forEach(function(sec){
    html += '<div class="checklist-section">' +
      '<h3>' + esc(sec.name) + '</h3>';
    sec.items.forEach(function(item){
      html += '<div class="check-item" onclick="toggleCheck(this)">' +
        '<div class="check-box"></div>' +
        '<span class="check-text">' + esc(item) + '</span>' +
      '</div>';
    });
    html += '</div>';
  });

  el.innerHTML = html;
}

function toggleCheck(el) {
  var box = el.querySelector('.check-box');
  box.classList.toggle('checked');
}

function renderPaint(paint, make, model) {
  var el = document.getElementById('tab-paint');
  if (!paint) {
    el.innerHTML = '<p style="color:#718096;text-align:center;padding:24px;">Данные по ЛКП для данной модели не найдены.</p>';
    return;
  }
  var zoneNames = {
    hood:'Капот', roof:'Крыша', doors:'Двери',
    fenders:'Крылья', trunk:'Крышка багажника'
  };

  var html = '<p class="notice notice-info">Заводская толщина ЛКП <strong>' + esc(make + ' ' + model) + '</strong>. Введите показания толщиномера для сравнения.</p>';
  html += '<div class="paint-grid">';

  Object.keys(paint).forEach(function(zone){
    var range = paint[zone];
    var zname = zoneNames[zone] || zone;
    html += '<div class="paint-zone">' +
      '<div class="paint-zone-name">' + esc(zname) + '</div>' +
      '<div class="paint-value">' + range[0] + '–' + range[1] + '</div>' +
      '<div class="paint-unit">мкм (норма)</div>' +
      '<input type="number" min="0" max="2000" placeholder="ваше" ' +
        'data-zone="' + zone + '" data-min="' + range[0] + '" data-max="' + range[1] + '" ' +
        'style="width:100%;margin-top:8px;padding:6px;border:2px solid #e2e8f0;border-radius:8px;text-align:center;font-size:.9rem;" ' +
        'oninput="evalPaint(this)">' +
      '<div id="pe-' + zone + '" style="margin-top:6px;font-size:.78rem;font-weight:600;color:#718096;">&nbsp;</div>' +
    '</div>';
  });

  html += '</div><p class="paint-note">* Значения значительно выше нормы — возможна шпаклёвка/перекраска. Ниже нормы — возможно снятие покрытия.</p>';
  el.innerHTML = html;
}

function evalPaint(input) {
  var zone = input.dataset.zone;
  var min = parseInt(input.dataset.min);
  var max = parseInt(input.dataset.max);
  var val = parseInt(input.value);
  var cell = document.getElementById('pe-' + zone);
  if (isNaN(val) || input.value === '') {
    cell.innerHTML = '&nbsp;'; cell.style.color = '#718096'; return;
  }
  if (val < min * 0.7) {
    cell.textContent = '↓ Ниже нормы'; cell.style.color = '#e53e3e';
  } else if (val > max * 1.4) {
    cell.textContent = '⚠ Шпаклёвка'; cell.style.color = '#e53e3e';
  } else if (val > max) {
    cell.textContent = '↑ Перекраска?'; cell.style.color = '#c05621';
  } else {
    cell.textContent = '✓ Норма'; cell.style.color = '#276749';
  }
}

function renderMaintenance(maint, mileage) {
  var el = document.getElementById('tab-maintenance');
  if (!maint || maint.length === 0) {
    el.innerHTML = '<p style="color:#718096;text-align:center;padding:24px;">Данные по регламенту ТО не найдены.</p>';
    return;
  }
  var html = '<div class="stats-row">' +
    '<div class="stat-box"><div class="stat-num">' + mileage.toLocaleString('ru') + '</div><div class="stat-label">пробег (км)</div></div>' +
    '</div>';

  maint.forEach(function(interval){
    var km = interval.km;
    var cycles = mileage > 0 ? Math.floor(mileage / km) : 0;
    var nextDue = (cycles + 1) * km;
    var remaining = nextDue - mileage;
    var cls, label;

    if (mileage === 0) {
      cls = 'upcoming'; label = 'Каждые ' + km.toLocaleString('ru') + ' км';
    } else if (remaining <= 0) {
      cls = 'overdue'; label = 'Просрочено на ' + Math.abs(remaining).toLocaleString('ru') + ' км';
    } else if (remaining <= 2000) {
      cls = 'current'; label = 'До ТО: ' + remaining.toLocaleString('ru') + ' км';
    } else {
      cls = 'upcoming'; label = 'До ТО: ' + remaining.toLocaleString('ru') + ' км';
    }

    html += '<div class="maint-item ' + cls + '">' +
      '<div class="maint-mileage">' + (km/1000) + 'тыс<br>км</div>' +
      '<div><div style="font-size:.82rem;font-weight:700;margin-bottom:6px;">' + esc(label) + '</div>' +
      '<ul class="maint-tasks">' +
      interval.items.map(function(it){ return '<li>' + esc(it) + '</li>'; }).join('') +
      '</ul></div>' +
    '</div>';
  });

  el.innerHTML = html;
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach(function(t){
    t.classList.toggle('active', t.getAttribute('onclick') === "showTab('" + name + "')");
  });
  ['problems','checklist','paint','maintenance'].forEach(function(n){
    var el = document.getElementById('tab-' + n);
    if (n === name) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
}

function resetAll() {
  document.getElementById('step1').style.display = '';
  document.getElementById('resultsCard').classList.add('hidden');

  var selMake = document.getElementById('selMake');
  selMake.value = '';

  var selModel = document.getElementById('selModel');
  selModel.innerHTML = '<option value="">— сначала марка —</option>';
  selModel.disabled = true;

  document.getElementById('genGroup').style.display = 'none';
  document.getElementById('selGen').innerHTML = '<option value="">— выберите поколение —</option>';

  document.getElementById('engGroup').style.display = 'none';
  document.getElementById('selEngine').innerHTML = '<option value="">— выберите двигатель —</option>';

  document.getElementById('mileageRow').style.display = 'none';
  document.getElementById('mileage').value = '';
  document.getElementById('btnAnalyze').disabled = true;
  currentGen = null;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

document.addEventListener('DOMContentLoaded', init);
