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
  document.getElementById('selMake').addEventListener('change', onMakeChange);
  document.getElementById('selModel').addEventListener('change', onModelChange);
  document.getElementById('selGen').addEventListener('change', onGenChange);
  document.getElementById('btnAnalyze').addEventListener('click', showResults);
  document.getElementById('btnReset').addEventListener('click', resetAll);
  document.querySelectorAll('.tab').forEach(function(t){
    t.addEventListener('click', function(){ showTab(t.dataset.tab); });
  });
}

function onMakeChange() {
  var make = document.getElementById('selMake').value;
  var selModel = document.getElementById('selModel');
  selModel.innerHTML = '<option value="">-- выберите модель --</option>';
  document.getElementById('selGen').innerHTML = '<option value="">-- выберите поколение --</option>';
  document.getElementById('selEngine').innerHTML = '<option value="">-- выберите двигатель --</option>';
  document.getElementById('mileageRow').style.display = 'none';
  document.getElementById('btnAnalyze').style.display = 'none';
  if (!make) return;
  var models = Object.keys(CARS[make]).sort(function(a,b){return a.localeCompare(b,'ru');});
  models.forEach(function(m){
    var o = document.createElement('option');
    o.value = m; o.textContent = m;
    selModel.appendChild(o);
  });
}

function onModelChange() {
  var make = document.getElementById('selMake').value;
  var model = document.getElementById('selModel').value;
  var selGen = document.getElementById('selGen');
  selGen.innerHTML = '<option value="">-- выберите поколение --</option>';
  document.getElementById('selEngine').innerHTML = '<option value="">-- выберите двигатель --</option>';
  document.getElementById('mileageRow').style.display = 'none';
  document.getElementById('btnAnalyze').style.display = 'none';
  if (!make || !model) return;
  var gens = CARS[make][model].gens;
  gens.forEach(function(g, i){
    var o = document.createElement('option');
    o.value = i; o.textContent = g.name;
    selGen.appendChild(o);
  });
}

function onGenChange() {
  var make = document.getElementById('selMake').value;
  var model = document.getElementById('selModel').value;
  var genIdx = document.getElementById('selGen').value;
  var selEngine = document.getElementById('selEngine');
  selEngine.innerHTML = '<option value="">-- выберите двигатель --</option>';
  document.getElementById('mileageRow').style.display = 'none';
  document.getElementById('btnAnalyze').style.display = 'none';
  if (!make || !model || genIdx === '') return;
  currentGen = CARS[make][model].gens[parseInt(genIdx)];
  currentGen.engines.forEach(function(e){
    var o = document.createElement('option');
    o.value = e; o.textContent = e;
    selEngine.appendChild(o);
  });
  document.getElementById('mileageRow').style.display = '';
  document.getElementById('btnAnalyze').style.display = '';
}

function showResults() {
  if (!currentGen) return;
  var mileage = parseInt(document.getElementById('mileage').value) || 0;
  var engine = document.getElementById('selEngine').value;
  var make = document.getElementById('selMake').value;
  var model = document.getElementById('selModel').value;

  document.getElementById('resultsTitle').textContent =
    make + ' ' + model + ' ' + currentGen.name + (engine ? ' (' + engine + ')' : '');

  renderProblems(currentGen.problems);
  renderChecklist(currentGen.problems, model);
  renderPaint(currentGen.paint, make, model);
  renderMaintenance(currentGen.maint, mileage);

  document.getElementById('step1Card').style.display = 'none';
  var rc = document.getElementById('resultsCard');
  rc.style.display = '';
  rc.classList.add('fade-in');
  showTab('problems');
}

function renderProblems(problems) {
  var el = document.getElementById('tab-problems');
  if (!problems || problems.length === 0) {
    el.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">' +
      'Серьёзных типичных проблем для данной модификации не выявлено.</p>';
    return;
  }
  var sev = {high: 'Высокая', medium: 'Средняя', low: 'Низкая'};
  el.innerHTML = problems.map(function(p){
    return '<div class="problem-item ' + p.s + '">' +
      '<div class="problem-header">' +
        '<span class="problem-title">' + esc(p.t) + '</span>' +
        '<span class="badge-' + p.s + '">Критичность: ' + sev[p.s] + '</span>' +
      '</div>' +
      '<div class="problem-detail">' + esc(p.d) + '</div>' +
    '</div>';
  }).join('');
}

function renderChecklist(problems, model) {
  var el = document.getElementById('tab-checklist');
  var sections = [
    { name: 'Кузов и ЛКП', items: [
      'Проверить кузов на следы ДТП (замятины, сколы, разная ширина зазоров)',
      'Измерить толщину лакокрасочного покрытия толщиномером по всем зонам',
      'Осмотреть пороги, арки, днище на предмет коррозии',
      'Проверить все уплотнители дверей и стёкол',
      'Осмотреть стёкла на сколы и трещины'
    ]},
    { name: 'Под капотом', items: [
      'Проверить уровни всех технических жидкостей',
      'Осмотреть патрубки на трещины и следы подтёков',
      'Проверить состояние ремней и цепей ГРМ',
      'Убедиться в отсутствии подтёков масла',
      'Осмотреть аккумулятор (дата изготовления, состояние клемм)'
    ]},
    { name: 'Салон', items: [
      'Проверить работу всей электроники и климата',
      'Осмотреть обивку и отсутствие неприятных запахов',
      'Проверить работу всех стеклоподъёмников',
      'Убедиться в работоспособности всех ремней безопасности',
      'Проверить пробег на соответствие состоянию педалей и руля'
    ]},
    { name: 'Ходовая часть', items: [
      'Проверить люфт рулевого управления',
      'Осмотреть состояние шин (износ, однородность)',
      'Проверить тормозные диски и колодки',
      'Прослушать подвеску при езде по неровностям',
      'Проверить ШРУС на пыльники и стуки'
    ]},
    { name: 'Тест-драйв', items: [
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
      if (p.s === 'high' || p.s === 'medium') {
        attn.push(p.t + ': ' + p.d);
      }
    });
  }

  var html = '';
  if (attn.length > 0) {
    html += '<div class="check-item" style="background:#fff3cd;border-left:4px solid #f0a500;margin-bottom:16px;">' +
      '<strong style="color:#856404;">Особое внимание для ' + esc(model) + ':</strong>' +
      '<ul style="margin:8px 0 0 16px;">' +
      attn.map(function(a){ return '<li>' + esc(a) + '</li>'; }).join('') +
      '</ul></div>';
  }

  sections.forEach(function(sec){
    html += '<div style="margin-bottom:16px;">' +
      '<h4 style="margin:0 0 8px;color:#333;border-bottom:2px solid #007bff;padding-bottom:4px;">' + esc(sec.name) + '</h4>';
    sec.items.forEach(function(item){
      html += '<div class="check-item"><span class="check-box">&#9744;</span>' + esc(item) + '</div>';
    });
    html += '</div>';
  });

  el.innerHTML = html;
}

function renderPaint(paint, make, model) {
  var el = document.getElementById('tab-paint');
  if (!paint) {
    el.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Данные по ЛКП для данной модели не найдены.</p>';
    return;
  }
  var zoneNames = {
    hood: 'Капот',
    roof: 'Крыша',
    doors: 'Двери',
    fenders: 'Крылья',
    trunk: 'Крышка багажника'
  };
  var html = '<p style="color:#555;margin-bottom:16px;">Заводская толщина ЛКП для <strong>' + esc(make + ' ' + model) + '</strong> по зонам (в мкм). Введите показания вашего толщиномера для сравнения.</p>';
  html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:14px;">' +
    '<thead><tr style="background:#f0f4ff;">' +
    '<th style="padding:10px;text-align:left;border:1px solid #ddd;">Зона</th>' +
    '<th style="padding:10px;text-align:center;border:1px solid #ddd;">Норма (мкм)</th>' +
    '<th style="padding:10px;text-align:center;border:1px solid #ddd;">Ваше значение (мкм)</th>' +
    '<th style="padding:10px;text-align:center;border:1px solid #ddd;">Оценка</th>' +
    '</tr></thead><tbody>';

  Object.keys(paint).forEach(function(zone){
    var range = paint[zone];
    var zname = zoneNames[zone] || zone;
    html += '<tr>' +
      '<td style="padding:10px;border:1px solid #ddd;">' + esc(zname) + '</td>' +
      '<td style="padding:10px;text-align:center;border:1px solid #ddd;">' + range[0] + ' &ndash; ' + range[1] + '</td>' +
      '<td style="padding:10px;text-align:center;border:1px solid #ddd;">' +
        '<input type="number" min="0" max="2000" placeholder="..." ' +
        'data-zone="' + zone + '" data-min="' + range[0] + '" data-max="' + range[1] + '" ' +
        'style="width:80px;padding:4px;border:1px solid #ccc;border-radius:4px;text-align:center;" ' +
        'oninput="evalPaint(this)">' +
      '</td>' +
      '<td id="paint-eval-' + zone + '" style="padding:10px;text-align:center;border:1px solid #ddd;color:#999;">—</td>' +
    '</tr>';
  });

  html += '</tbody></table></div>';
  html += '<p style="margin-top:12px;font-size:12px;color:#888;">* Значения значительно выше нормы могут указывать на перекраску или шпаклёвку. Значения ниже нормы — возможно снятие покрытия.</p>';
  el.innerHTML = html;
}

function evalPaint(input) {
  var zone = input.dataset.zone;
  var min = parseInt(input.dataset.min);
  var max = parseInt(input.dataset.max);
  var val = parseInt(input.value);
  var cell = document.getElementById('paint-eval-' + zone);
  if (isNaN(val) || input.value === '') {
    cell.textContent = '—'; cell.style.color = '#999'; return;
  }
  var over = max * 1.4;
  var under = min * 0.7;
  if (val < under) {
    cell.textContent = 'Ниже нормы'; cell.style.color = '#dc3545';
  } else if (val > over) {
    cell.textContent = 'Шпаклёвка/перекраска'; cell.style.color = '#dc3545';
  } else if (val > max) {
    cell.textContent = 'Возможна перекраска'; cell.style.color = '#fd7e14';
  } else {
    cell.textContent = 'В норме'; cell.style.color = '#28a745';
  }
}

function renderMaintenance(maint, mileage) {
  var el = document.getElementById('tab-maintenance');
  if (!maint || maint.length === 0) {
    el.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Данные по регламенту обслуживания не найдены.</p>';
    return;
  }
  var html = '<p style="color:#555;margin-bottom:16px;">Регламент обслуживания. Ваш пробег: <strong>' + mileage.toLocaleString('ru') + ' км</strong>.</p>';
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;font-size:13px;">' +
    '<span style="background:#fce8e8;color:#c0392b;padding:4px 10px;border-radius:12px;">Просрочено</span>' +
    '<span style="background:#fff3cd;color:#856404;padding:4px 10px;border-radius:12px;">Текущее ТО</span>' +
    '<span style="background:#e8f5e9;color:#2e7d32;padding:4px 10px;border-radius:12px;">Предстоящее</span>' +
    '</div>';

  maint.forEach(function(interval){
    var km = interval.km;
    var cycles = mileage > 0 ? Math.floor(mileage / km) : 0;
    var nextDue = (cycles + 1) * km;
    var remaining = nextDue - mileage;
    var cls, label;

    if (mileage === 0) {
      cls = 'upcoming'; label = 'Каждые ' + km.toLocaleString('ru') + ' км';
    } else if (remaining < 0) {
      cls = 'overdue'; label = 'Просрочено на ' + Math.abs(remaining).toLocaleString('ru') + ' км';
    } else if (remaining <= 2000) {
      cls = 'current'; label = 'До ТО: ' + remaining.toLocaleString('ru') + ' км';
    } else {
      cls = 'upcoming'; label = 'До ТО: ' + remaining.toLocaleString('ru') + ' км';
    }

    html += '<div class="maint-item ' + cls + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<strong>Каждые ' + km.toLocaleString('ru') + ' км</strong>' +
        '<span style="font-size:13px;">' + esc(label) + '</span>' +
      '</div>' +
      '<ul style="margin:0;padding-left:20px;">' +
      interval.items.map(function(it){ return '<li>' + esc(it) + '</li>'; }).join('') +
      '</ul>' +
    '</div>';
  });

  el.innerHTML = html;
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.tab-content').forEach(function(c){
    c.classList.toggle('hidden', c.id !== 'tab-' + name);
  });
}

function resetAll() {
  document.getElementById('step1Card').style.display = '';
  document.getElementById('resultsCard').style.display = 'none';
  document.getElementById('selMake').value = '';
  document.getElementById('selModel').innerHTML = '<option value="">—— выберите модель ——</option>';
  document.getElementById('selGen').innerHTML = '<option value="">—— выберите поколение ——</option>';
  document.getElementById('selEngine').innerHTML = '<option value="">—— выберите двигатель ——</option>';
  document.getElementById('mileageRow').style.display = 'none';
  document.getElementById('btnAnalyze').style.display = 'none';
  document.getElementById('mileage').value = '';
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
