
window.onload = function() {
  var nav = document.getElementById('tab-nav');
  if (nav) {
    nav.addEventListener('click', function(e) {
      var btn = e.target;
      if (!btn.classList.contains('tab-btn')) return;
      var tab = btn.id.replace('btn-', '');
      showTab(tab);
    });
  }
};

const ADMIN_PASSWORD = 'posan3628!';
const STORAGE_KEY = 'posan_survey_responses';
const ROW_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,42,43,44,45,46,47,49];
const TOTAL_ROWS = ROW_IDS.length;
let selectedRole = '', overallOpinion = '';

function showTab(tab) {
  var sections = document.getElementsByClassName('section');
  for (var i = 0; i < sections.length; i++) {
    sections[i].className = 'section';
  }
  var btns = document.getElementsByClassName('tab-btn');
  for (var j = 0; j < btns.length; j++) {
    btns[j].className = 'tab-btn';
  }
  var target = document.getElementById('tab-' + tab);
  if (target) { target.className = 'section active'; }
  var activeBtn = document.getElementById('btn-' + tab);
  if (activeBtn) { activeBtn.className = 'tab-btn active'; }
  if (tab === 'admin') { renderDashboard(); }
}

function selectRole(btn, role) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRole = role;
}

function selectOverall(val) {
  overallOpinion = val;
  document.querySelectorAll('.agree-option').forEach(el => el.classList.remove('selected-agree','selected-partial','selected-disagree'));
  if(document.getElementById('opt-' + val)) document.getElementById('opt-' + val).classList.add('selected-' + val);

  // 전체 동의/반대 처리
  if (val === 'agree') {
    ROW_IDS.forEach(id => {
      const radio = document.querySelector(`input[name="row_${id}"][value="agree"]`);
      if (radio) radio.checked = true;
    });
  } else if (val === 'disagree') {
    ROW_IDS.forEach(id => {
      const radio = document.querySelector(`input[name="row_${id}"][value="disagree"]`);
      if (radio) radio.checked = true;
    });
  }
  updateProgress();
}

function updateProgress() {
  let answered = 0;
  ROW_IDS.forEach(id => { if (document.querySelector(`input[name="row_${id}"]:checked`)) answered++; });
  const pct = Math.round(answered / TOTAL_ROWS * 100);
  document.getElementById('survey-progress').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct;
}

function submitSurvey() {
  if (!selectedRole) { alert('응답자 구분(학생/학부모/교직원)을 선택해 주세요.'); return; }
  if (!overallOpinion) { alert('개정안 전체에 대한 최종 의견을 선택해 주세요.'); return; }
  const responses = {};
  ROW_IDS.forEach(id => {
    const checked = document.querySelector(`input[name="row_${id}"]:checked`);
    if (checked) responses[id] = checked.value;
  });
  const answeredCount = Object.keys(responses).length;
  if (answeredCount < TOTAL_ROWS * 0.5) {
    if (!confirm(`전체 ${TOTAL_ROWS}개 항목 중 ${answeredCount}개만 응답하셨습니다.\n미응답 항목이 있어도 제출하시겠습니까?`)) return;
  }
  const secComments = {};
  for(let i=1; i<=17; i++) {
    const el = document.getElementById('sec_comment_' + i);
    if(el && el.value.trim()) secComments[i] = el.value.trim();
  }
  const entry = { timestamp: new Date().toISOString(), role: selectedRole, overall: overallOpinion, comments: document.getElementById('comments').value, secComments, responses };
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  existing.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
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
  const data = getData();
  const total = data.length;
  const byRole = {student:0, parent:0, teacher:0};
  const overallCounts = {agree:0, partial:0, disagree:0};
  data.forEach(d => { if (byRole[d.role]!==undefined) byRole[d.role]++; if (overallCounts[d.overall]!==undefined) overallCounts[d.overall]++; });
  const agreeRate = total > 0 ? Math.round(overallCounts.agree/total*100) : 0;
  const partialRate = total > 0 ? Math.round(overallCounts.partial/total*100) : 0;
  const disagreeRate = total > 0 ? Math.round(overallCounts.disagree/total*100) : 0;
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">총 응답 수</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--success)">${agreeRate}%</div><div class="stat-label">전체 동의율</div></div>
    <div class="stat-card"><div class="stat-num">${byRole.student}</div><div class="stat-label">학생 응답</div></div>
    <div class="stat-card"><div class="stat-num">${byRole.parent}</div><div class="stat-label">학부모 응답</div></div>
    <div class="stat-card"><div class="stat-num">${byRole.teacher}</div><div class="stat-label">교직원 응답</div></div>`;
  const roles = [['student','학생'],['parent','학부모'],['teacher','교직원']];
  let roleHtml = '';
  roles.forEach(([key, label]) => {
    const rd = data.filter(d=>d.role===key); const rt = rd.length;
    const ra = rt>0 ? Math.round(rd.filter(d=>d.overall==='agree').length/rt*100) : 0;
    const rp = rt>0 ? Math.round(rd.filter(d=>d.overall==='partial').length/rt*100) : 0;
    const rdi = rt>0 ? Math.round(rd.filter(d=>d.overall==='disagree').length/rt*100) : 0;
    roleHtml += `<div style="margin-bottom:20px;"><div style="font-weight:700;margin-bottom:8px;font-size:0.95rem;">${label} (${rt}명)</div>
      <div class="rate-bar-wrap"><div class="rate-bar-label"><span>✅ 동의 ${ra}%</span><span>❌ 반대 ${rdi}%</span></div>
      <div class="rate-bar"><div class="rate-bar-fill-agree" style="width:${ra}%"></div><div class="rate-bar-fill-disagree" style="width:${rdi}%"></div></div></div></div>`;
  });
  document.getElementById('role-chart').innerHTML = roleHtml;
  const itemLabels = {1:'용어: 선도→생활지도',2:'용어: 상담실→Wee클래스',3:'용어: 공과금→공금',4:'용어: 학생생활부→바른생활부',5:'용어: 생활지도부장→생활교육담당부장',6:'제2조 목적 수정',7:'제3조 적용근거 수정',8:'제4조 적용범위 수정',9:'제5조 교육3주체 책무 신설',10:'제2장 학생생활교육위원회 구조',11:'제5조→제7조 구성 및 의결',12:'제6조 목적 신설',13:'위원회 사무 주관 변경',14:'제8조→제10조 기록',15:'장애학생 징계 원칙 수정',16:'징계 방법 수정',17:'제102조 사회봉사',18:'제103조 특별교육이수(①)',19:'제103조 특별교육이수(④) 교권침해',20:'출석정지',21:'퇴학처분',22:'용의복장: 화장 규정',23:'용의복장: 장신구',24:'용의복장: 두발·교복',25:'소지품: 금지물품 목록',26:'스마트기기 사용 제한',27:'제5장→제1장 이동',28:'상담(④) 수정',29:'상담 신설 조항',30:'상담(⑤~⑥) 수정',31:'훈육: 물리적→방어제지',32:'방어제지 정의 신설',33:'제지 보고 의무 수정',34:'개별학생교육지원 조항',35:'가정학습 요청',36:'생활지도 불응 조치',37:'징계→제2절 이동',38:'시상→포상',39:'3년정근상 삭제',40:'상벌점제 디지털화',41:'조항 번호 전면 변경',42:'벌점 항목 추가',43:'생활복 동복 추가',44:'생활복 하복 추가',45:'체육복 추가',46:'학생증→학생명찰',47:'명칭 변경',49:'제101조 학교 내 봉사 항목 신설'};
  if (total === 0) {
    document.getElementById('item-chart').innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">아직 응답 데이터가 없습니다.</p>';
  } else {
    let itemHtml = '<table class="responses-table"><thead><tr><th>항목</th><th>동의</th><th>반대</th><th>미응답</th></tr></thead><tbody>';
    ROW_IDS.forEach(id => {
      const ans = data.filter(d=>d.responses[id]);
      const ag = ans.filter(d=>d.responses[id]==='agree').length;
      const pa = ans.filter(d=>d.responses[id]==='partial').length;
      const di = ans.filter(d=>d.responses[id]==='disagree').length;
      const na = total - ans.length;
      itemHtml += `<tr><td>${id}. ${itemLabels[id]||'항목'+id}</td><td style="color:var(--success)">✅ ${ag}명</td><td style="color:var(--danger)">❌ ${di}명</td><td style="color:#aaa">— ${na}명</td></tr>`;
    });
    itemHtml += '</tbody></table>';
    document.getElementById('item-chart').innerHTML = itemHtml;
  }
  const secNames = {"1":"용어 변경","2":"제1장 총칙","3":"교육 3주체의 책무 (신설)","4":"제2장 학생생활교육위원회","5":"징계","6":"용의·복장","7":"소지품 관리","8":"스마트기기 관련","9":"총칙 이동","10":"상담·정서·행동 지원","11":"훈육 및 제지","12":"개별학생교육지원","13":"생활지도 불응 시 조치","14":"시상·포상","15":"상벌점제","16":"항목 추가","17":"학생 명찰"};
  let secHtml = '';
  for(let i=1; i<=17; i++) {
    const secEntries = data.filter(d=>d.secComments&&d.secComments[i]);
    if(secEntries.length > 0) {
      secHtml += '<div style="margin-bottom:20px;"><div style="font-weight:700;color:var(--primary);font-size:0.9rem;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">Q' + i + '. ' + secNames[i] + '</div>';
      secEntries.forEach(d => {
        secHtml += '<div style="border-left:3px solid var(--accent);padding:8px 14px;margin-bottom:8px;background:#fafaf6;border-radius:0 6px 6px 0;font-size:0.87rem;line-height:1.7;"><span style=\"font-size:0.78rem;color:var(--text-muted);\">[' + (roleNames[d.role]||d.role) + '] ' + new Date(d.timestamp).toLocaleString('ko-KR') + '</span><br>' + d.secComments[i].replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>';
      });
      secHtml += '</div>';
    }
  }
  document.getElementById('sec-comments-list').innerHTML = secHtml || '<p style=\"color:var(--text-muted);font-size:0.9rem;\">섹션별 서술형 의견 없음</p>';
  const comments = data.filter(d=>d.comments&&d.comments.trim());
  const roleNames = {student:'학생',parent:'학부모',teacher:'교직원'};
  document.getElementById('comments-list').innerHTML = comments.length === 0
    ? '<p style="color:var(--text-muted);font-size:0.9rem;">의견 없음</p>'
    : comments.map(d => `<div style="border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px;"><div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">[${roleNames[d.role]||d.role}] ${new Date(d.timestamp).toLocaleString('ko-KR')} · 전체의견: ${d.overall==='agree'?'✅ 동의':'❌ 반대'}</div><div style="font-size:0.9rem;line-height:1.7;">${d.comments.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></div>`).join('');
}

function clearData() {
  if (confirm('모든 응답 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    localStorage.removeItem(STORAGE_KEY); renderDashboard();
  }
}
try { updateProgress(); } catch(e) { console.log(e); }
