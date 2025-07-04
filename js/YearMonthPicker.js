/**
 * YearMonthPicker.js - 년/월 빠른이동 공통 모듈
 * MiniCalendarComponent_05.html과 DatePickerComponent.js에서 공통으로 사용
 */

// CSS 스타일 (필요시 각 컴포넌트에서 덮어쓸 수 있음)
const YEAR_MONTH_PICKER_STYLES = `
.year-month-picker {
    position: absolute;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    border: 2px solid red;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    z-index: 9999;
    padding: 24px 32px;
    min-width: 260px;
}
.year-month-content {
    display: flex;
    gap: 24px;
}
.year-picker, .month-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.year-picker-title, .month-picker-title {
    font-size: 0.95em;
    font-weight: 600;
    margin-bottom: 8px;
}
.year-picker-grid, .month-picker-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
}
.year-picker-item, .month-picker-item {
    border: none;
    background: #f3f4f6;
    border-radius: 4px;
    padding: 4px 10px;
    margin: 2px 0;
    cursor: pointer;
    font-size: 1em;
    transition: background 0.15s;
}
.year-picker-item.current, .month-picker-item.current {
    background: #3b82f6;
    color: #fff;
    font-weight: 600;
}
.year-picker-item:hover, .month-picker-item:hover {
    background: #dbeafe;
}
`;

// 스타일이 이미 추가되었는지 확인하는 플래그
let stylesAdded = false;

/**
 * 년/월 선택 오버레이를 표시하는 함수
 * @param {Object} options - 설정 옵션
 * @param {HTMLElement} options.container - 오버레이를 붙일 컨테이너 요소
 * @param {number} options.currentYear - 현재 연도
 * @param {number} options.currentMonth - 현재 월 (0~11)
 * @param {Function} options.onSelect - 선택 시 콜백 함수 (year, month) => void
 * @param {string} options.customStyles - 커스텀 CSS 스타일 (선택사항)
 */
function showYearMonthPicker(options) {
    const { container, currentYear, currentMonth, onSelect } = options;
    console.log('[YearMonthPicker] showYearMonthPicker 진입', { currentYear, currentMonth });
    // 기존 오버레이 제거
    const existing = document.querySelector('.year-month-picker');
    if (existing) existing.remove();
    // 년/월 선택 오버레이 생성
    const picker = document.createElement('div');
    picker.className = 'year-month-picker';
    picker.innerHTML = `
        <div class="year-month-content">
            ${createYearMonthPickerHTML(currentYear, currentMonth)}
        </div>
    `;
    // 컨테이너에 추가
    container.appendChild(picker);
    picker.classList.add('show');
    // 이벤트 바인딩
    bindYearMonthPickerEvents(picker, onSelect);
    // 외부 클릭 시 닫기
    setTimeout(() => {
        document.addEventListener('click', yearMonthOverlayCloseHandler);
    }, 10);
}

/**
 * 년/월 선택 오버레이를 토글하는 함수
 * @param {Object} options - showYearMonthPicker와 동일한 옵션
 */
function toggleYearMonthPicker(options) {
    console.log('[YearMonthPicker] toggleYearMonthPicker 진입');
    const existing = document.querySelector('.year-month-picker');
    if (existing) {
        existing.remove();
        document.removeEventListener('click', yearMonthOverlayCloseHandler);
        return;
    }
    showYearMonthPicker(options);
}

/**
 * 년/월 선택 HTML 생성
 */
function createYearMonthPickerHTML(currentYear, currentMonth) {
    const yearRange = [];
    for (let i = currentYear - 3; i <= currentYear + 3; i++) {
        yearRange.push(i);
    }
    const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    
    return `
        <div class="year-picker">
            <div class="year-picker-title">년도</div>
            <div class="year-picker-grid">
                ${yearRange.map(year => `
                    <button class="year-picker-item ${year === currentYear ? 'current' : ''}" data-year="${year}">${year}</button>
                `).join('')}
            </div>
        </div>
        <div class="month-picker">
            <div class="month-picker-title">월</div>
            <div class="month-picker-grid">
                ${monthNames.map((month, idx) => `
                    <button class="month-picker-item ${idx === currentMonth ? 'current' : ''}" data-month="${idx}">${month}</button>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * 년/월 선택 이벤트 바인딩
 */
function bindYearMonthPickerEvents(picker, onSelect) {
    console.log('[YearMonthPicker] bindYearMonthPickerEvents 진입');
    picker.addEventListener('click', function(e) {
        e.stopPropagation();
        if (e.target.classList.contains('year-picker-item')) {
            const selectedYear = parseInt(e.target.dataset.year);
            console.log('[YearMonthPicker] 년도 선택:', selectedYear);
            onSelect(selectedYear, null);
            picker.remove();
            document.removeEventListener('click', yearMonthOverlayCloseHandler);
        }
        if (e.target.classList.contains('month-picker-item')) {
            const selectedMonth = parseInt(e.target.dataset.month);
            console.log('[YearMonthPicker] 월 선택:', selectedMonth + 1);
            onSelect(null, selectedMonth);
            picker.remove();
            document.removeEventListener('click', yearMonthOverlayCloseHandler);
        }
    });
}

/**
 * 외부 클릭 시 오버레이 닫기 핸들러
 */
function yearMonthOverlayCloseHandler(e) {
    const picker = document.querySelector('.year-month-picker');
    if (!picker) return;
    if (!picker.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', yearMonthOverlayCloseHandler);
    }
}

// 전역 객체로 노출 (ES6 모듈이 아닌 환경에서도 사용 가능)
if (typeof window !== 'undefined') {
    window.YearMonthPicker = {
        show: showYearMonthPicker,
        toggle: toggleYearMonthPicker
    };
} 