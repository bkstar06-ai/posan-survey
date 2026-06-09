const ADMIN_PASSWORD = 'posan3628!';
const STORAGE_KEY = 'posan_survey_responses';
const ROW_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,42,43,44,45,46,47,49];
const TOTAL_ROWS = ROW_IDS.length;
let selectedRole = '', overallOpinion = '';

function showTab(tab) {
  var sections = document.getElementsByClassName('section');
  for (var i = 0; i < sections.length; i++) { sections[i].className = 'section'; }
  var btns = document.getElementsByClassName('tab-btn');
  for (var j = 0; j < btns.length; j++) { btns[j].className = 'tab-btn'; }
  var target = document.getElementById('tab-' + tab);
  if (target) target.className = 'section active';
  var activeBtn = document.getElementById('btn-' + tab);
  if (activeBtn) activeBtn.className = 'tab-btn active';
  if (tab === 'admin') renderDashboard();
}

function selectRole(btn, role) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRole = role;
}

function selectOverall(val) {
  overallOpinion = val;
  document.querySelectorAll('.agree-option').forEach(el => el.classList.remove('selected-agree','selected-partial','selected-disagree'));
  if (document.getElementById('opt-' + val)) document.getElementById('opt-' + val).classList.add('selected-' + val);
  if (val === 'agree') {
    ROW_IDS.forEach(id => { var r = document.querySelector('input[name="row_'+id+'"][value="agree"]'); if(r) r.checked=true; });
  } else if (val === 'disagree') {
    ROW_IDS.forEach(id => { var r = document.querySelector('input[name="row_'+id+'"][value="disagree"]'); if(r) r.checked=true; });
  }
  updateProgress();
}

function updateProgress() {
  var answered = 0;
  ROW_IDS.forEach(function(id) { if (document.querySelector('input[name="row_'+id+'"]:checked')) answered++; });
  var pct = Math.round(answered / TOTAL_ROWS * 100);
  document.getElementById('survey-progress').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct;
}

function submitSurvey() {
  if (!selectedRole) { alert('응답자 구분(학생/학부모/교직원)을 선택해 주세요.'); return; }
  if (!overallOpinion) { alert('개정안 전체에 대한 최종 의견을 선택해 주세요.'); return; }
  var responses = {};
  ROW_IDS.forEach(function(id) {
    var checked = document.querySelector('input[name="row_'+id+'"]:checked');
    if (checked) responses[id] = checked.value;
  });
  var answeredCount = Object.keys(responses).length;
  if (answeredCount < TOTAL_ROWS * 0.5) {
    if (!confirm('전체 '+TOTAL_ROWS+'개 항목 중 '+answeredCount+'개만 응답하셨습니다. 미응답 항목이 있어도 제출하시겠습니까?')) return;
  }
  var entry = { timestamp: new Date().toISOString(), role: selectedRole, overall: overallOpinion, comments: document.getElementById('comments').value, responses: responses };
  var existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  existing.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  // Google Sheets 전송
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbw6u1emnKWKp0_VY_9Obz2QYp3miwLy66qrrLzZ_NprOy5z-CzxZcTfN7kxnKrOWpS7Vw/exec';
  fetch(SHEET_URL, {
    method: 'POST',
    body: JSON.stringify(entry)
  }).catch(function(err) { console.log('전송 오류:', err); });

  document.getElementById('survey-form-area').style.display = 'none';
  document.getElementById('thankyou-area').style.display = 'block';
}

function resetSurvey() {
  selectedRole = ''; overallOpinion = '';
  document.getElementById('survey-form-area').style.display = 'block';
  document.getElementById('thankyou-area').style.display = 'none';
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.agree-option').forEach(el => el.classList.remove('selected-agree','selected-partial','selected-disagree'));
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.getElementById('comments').value = '';
  updateProgress();
  window.scrollTo(0, 0);
}

function adminLogin() {
  if (document.getElementById('admin-pw').value === ADMIN_PASSWORD) {
    document.getElementById('admin-gate').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    renderDashboard();
  } else {
    document.getElementById('pw-error').style.display = 'block';
  }
}

function getData() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }

function renderDashboard() {
  var data = getData();
  var total = data.length;
  var byRole = {student:0, parent:0, teacher:0};
  var overallCounts = {agree:0, disagree:0};
  data.forEach(function(d) {
    if (byRole[d.role]!==undefined) byRole[d.role]++;
    if (overallCounts[d.overall]!==undefined) overallCounts[d.overall]++;
  });
  var agreeRate = total > 0 ? Math.round(overallCounts.agree/total*100) : 0;
  document.getElementById('stats-grid').innerHTML =
    '<div class="stat-card"><div class="stat-num">'+total+'</div><div class="stat-label">총 응답 수</div></div>'+
    '<div class="stat-card"><div class="stat-num" style="color:var(--success)">'+agreeRate+'%</div><div class="stat-label">전체 동의율</div></div>'+
    '<div class="stat-card"><div class="stat-num">'+byRole.student+'</div><div class="stat-label">학생 응답</div></div>'+
    '<div class="stat-card"><div class="stat-num">'+byRole.parent+'</div><div class="stat-label">학부모 응답</div></div>'+
    '<div class="stat-card"><div class="stat-num">'+byRole.teacher+'</div><div class="stat-label">교직원 응답</div></div>';

  var roles = [['student','학생'],['parent','학부모'],['teacher','교직원']];
  var roleHtml = '';
  roles.forEach(function(r) {
    var rd = data.filter(function(d){return d.role===r[0];}); var rt = rd.length;
    var ra = rt>0 ? Math.round(rd.filter(function(d){return d.overall==='agree';}).length/rt*100) : 0;
    var rdi = rt>0 ? Math.round(rd.filter(function(d){return d.overall==='disagree';}).length/rt*100) : 0;
    roleHtml += '<div style="margin-bottom:20px;"><div style="font-weight:700;margin-bottom:8px;font-size:0.95rem;">'+r[1]+' ('+rt+'명)</div>'+
      '<div class="rate-bar-wrap"><div class="rate-bar-label"><span>\u2705 동의 '+ra+'%</span><span>\u274c 반대 '+rdi+'%</span></div>'+
      '<div class="rate-bar"><div class="rate-bar-fill-agree" style="width:'+ra+'%"></div><div class="rate-bar-fill-disagree" style="width:'+rdi+'%"></div></div></div></div>';
  });
  document.getElementById('role-chart').innerHTML = roleHtml;

  if (total === 0) {
    document.getElementById('item-chart').innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">아직 응답 데이터가 없습니다.</p>';
  } else {
    var itemHtml = '<table class="responses-table"><thead><tr><th>항목</th><th>동의</th><th>반대</th><th>미응답</th></tr></thead><tbody>';
    ROW_IDS.forEach(function(id) {
      var ans = data.filter(function(d){return d.responses[id];});
      var ag = ans.filter(function(d){return d.responses[id]==='agree';}).length;
      var di = ans.filter(function(d){return d.responses[id]==='disagree';}).length;
      var na = total - ans.length;
      itemHtml += '<tr><td>'+id+'번</td><td style="color:var(--success)">\u2705 '+ag+'명</td><td style="color:var(--danger)">\u274c '+di+'명</td><td style="color:#aaa">\u2014 '+na+'명</td></tr>';
    });
    itemHtml += '</tbody></table>';
    document.getElementById('item-chart').innerHTML = itemHtml;
  }

  var comments = data.filter(function(d){return d.comments&&d.comments.trim();});
  var roleNames = {student:'학생',parent:'학부모',teacher:'교직원'};
  document.getElementById('comments-list').innerHTML = comments.length === 0
    ? '<p style="color:var(--text-muted);font-size:0.9rem;">의견 없음</p>'
    : comments.map(function(d) {
        return '<div style="border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px;">'+
          '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">['+( roleNames[d.role]||d.role)+'] '+new Date(d.timestamp).toLocaleString('ko-KR')+'</div>'+
          '<div style="font-size:0.9rem;line-height:1.7;">'+d.comments.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div></div>';
      }).join('');
}

function clearData() {
  if (confirm('모든 응답 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    localStorage.removeItem(STORAGE_KEY); renderDashboard();
  }
}

updateProgress();
