class DatePickerComponent {
    constructor(options = {}) {
        this.options = {
            mode: 'single', // 'single' 또는 'range'
            format: 'YYYYMMDD',
            onSelect: null,
            onApply: null,
            ...options
        };
        
        this.startDate = null;
        this.endDate = null;
        this.selectedDate = null;
        this.currentDate = new Date();
        this.leftDate = new Date(); // 듀얼 달력용 왼쪽 날짜
        this.rightDate = new Date(); // 듀얼 달력용 오른쪽 날짜
        this.currentInputElement = null;
        this.overlay = null;
        this.picker = null;
        this.REFERENCE_DATE = new Date(2025, 8, 1); // 2025-09-01
        
        this.weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        this.init();
    }
    
    init() {
        this.createStyles();
        this.createOverlay();
    }
    
    createStyles() {
        if (document.getElementById('datepicker-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'datepicker-styles';
        style.textContent = `
            .datepicker-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.3);
                z-index: 10000;
                display: none;
            }
            
            .datepicker-overlay.show {
                display: block;
            }
            
            /* 기존 미니달력 CSS 그대로 사용 */
            .mini-calendar-container {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                width: 100%;
                max-width: 205px;
                padding: 12px 10px 10px 10px;
            }
            
            /* 듀얼 달력용 컨테이너 */
            .mini-calendar-container.dual-mode {
                max-width: 430px;
                display: flex;
                gap: 15px;
            }
            
            .calendar-side {
                flex: 1;
                min-width: 200px;
            }
            
            .calendar-side .mini-calendar-header {
                margin-right: 0;
            }
            
            .calendar-side .mini-calendar-title {
                display: flex;
                gap: 4px;
                align-items: center;
            }
            
            .calendar-side .mini-calendar-controls button.nav-prev,
            .calendar-side .mini-calendar-controls button.nav-next {
                display: none;
            }
            
            .calendar-side:first-child .mini-calendar-controls button.nav-prev {
                display: block;
            }
            
            .calendar-side:last-child .mini-calendar-controls button.nav-next {
                display: block;
            }
            
            .mini-calendar-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                margin-right: 25px;
            }
            
            .mini-calendar-title {
                font-size: 0.9em;
                font-weight: 600;
                color: #374151;
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .mini-calendar-title.small {
                font-size: 0.64em;
                font-weight: 500;
            }
            
            .mini-calendar-controls {
                display: flex;
                gap: 3px;
                align-items: right;
            }
            
            .mini-calendar-controls button {
                background: none;
                border: none;
                color: #6b7280;
                font-size: 1.04em;
                cursor: pointer;
                padding: 3px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }
            
            .mini-calendar-controls button:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .mini-calendar-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
            }
            
            .mini-calendar-weekday {
                text-align: center;
                font-size: 0.64em;
                color: #9ca3af;
                font-weight: 500;
                padding: 2px 0 4px 0;
            }
            
            .mini-calendar-day {
                text-align: center;
                font-size: 0.7em;
                padding: 4px 0;
                border-radius: 50%;
                cursor: pointer;
                color: #374151;
                transition: background 0.15s, color 0.15s;
                position: relative;
                min-height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid transparent;
                margin: -1px 0 0 -1px;
            }
            
            .mini-calendar-day.other-month,
            .mini-calendar-day.disabled {
                color: #d1d5db;
                cursor: pointer;
                background: none;
            }
            
            .mini-calendar-day.other-month:hover,
            .mini-calendar-day.disabled:hover {
                background: #f3f4f6;
            }
            
            .mini-calendar-day.month-alt {
                background-color: #fff4d6;
                border-radius: 4px !important;
            }
            
            .mini-calendar-day.month-alt.selected {
                background-color: #28a745 !important;
                color: #fff !important;
                font-weight: 600;
                border-radius: 50% !important;
            }
            
            .mini-calendar-day.saturday {
                color: #3b82f6;
            }
            
            .mini-calendar-day.sunday {
                color: #ef4444;
            }
            
            /* 월별 그룹 라인 스타일링 */
            .mini-calendar-day.month-group {
                border: 1px solid transparent;
                border-radius: 0;
            }

            /* 월 그룹의 경계선 강화 */
            .mini-calendar-day.month-top {
                border-top: 1px solid #d1d5db;
            }

            .mini-calendar-day.month-bottom {
                border-bottom: 1px solid #d1d5db;
            }

            .mini-calendar-day.month-left {
                border-left: 1px solid #d1d5db;
            }

            .mini-calendar-day.month-right {
                border-right: 1px solid #d1d5db;
            }

            /* 선택된 날짜는 사각형 스타일 */
            .mini-calendar-day.selected {
                background: #3b82f6 !important;
                color: #fff !important;
                font-weight: 600;
                border-radius: 4px !important;
            }
            
            /* 오늘 날짜는 사각형 스타일 */
            .mini-calendar-day.today {
                background: #6366f1 !important;
                color: #fff !important;
                font-weight: 600;
                border-radius: 4px !important;
            }
            
            .mini-calendar-day.range-start {
                background: #3b82f6;
                color: #fff;
                font-weight: 600;
            }
            
            .mini-calendar-day.range-end {
                background: #3b82f6;
                color: #fff;
                font-weight: 600;
            }
            
            .mini-calendar-day.in-range {
                background: #dbeafe;
                color: #1e40af;
            }
            
            .mini-calendar-day:hover:not(.other-month) {
                background: #f3f4f6;
            }
            
            .mini-calendar-day.selected:hover,
            .mini-calendar-day.range-start:hover,
            .mini-calendar-day.range-end:hover {
                background: #2563eb;
            }
            
            .datepicker-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 14px;
                color: #6b7280;
                cursor: pointer;
                padding: 3px;
                border-radius: 3px;
                transition: background 0.2s;
                z-index: 10;
            }
            
            .datepicker-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .datepicker-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-top: 1px solid #e5e7eb;
                margin-top: 8px;
            }
            
            .datepicker-selected {
                font-size: 0.68em;
                color: #6b7280;
                font-weight: 500;
            }
            
            .datepicker-actions {
                display: flex;
                gap: 4px;
            }
            
            .datepicker-btn {
                padding: 4px 8px;
                border: 1px solid #e5e7eb;
                border-radius: 2px;
                background: #fff;
                color: #6b7280;
                cursor: pointer;
                font-size: 0.64em;
                transition: all 0.2s;
            }
            
            .datepicker-btn:hover {
                background: #f9fafb;
                border-color: #d1d5db;
            }
            
            .datepicker-btn.apply {
                background: #3b82f6;
                color: #fff;
                border-color: #3b82f6;
            }
            
            .datepicker-btn.apply:hover {
                background: #2563eb;
                border-color: #2563eb;
            }
        `;
        document.head.appendChild(style);
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'datepicker-overlay';
        
        this.picker = document.createElement('div');
        this.picker.className = this.options.mode === 'range' ? 'mini-calendar-container dual-mode' : 'mini-calendar-container';
        this.picker.style.position = 'relative';
        
        if (this.options.mode === 'range') {
            // 듀얼 달력용 날짜 초기화
            this.leftDate = new Date();
            this.rightDate = new Date(this.leftDate);
            this.rightDate.setMonth(this.rightDate.getMonth() + 1);
            
            this.picker.innerHTML = this.createDualCalendarHTML();
        } else {
            this.picker.innerHTML = this.createSingleCalendarHTML();
        }
        
        this.overlay.appendChild(this.picker);
        document.body.appendChild(this.overlay);
        
        this.bindEvents();
    }
    
    createSingleCalendarHTML() {
        return `
            <button class="datepicker-close">×</button>
            
            <div class="mini-calendar-header">
                <div class="mini-calendar-title">
                    <span id="calendarYearMonth">2025.06</span>
                </div>
                <div class="mini-calendar-controls">
                    <button id="prevBtn">‹</button>
                    <button id="nextBtn">›</button>
                </div>
            </div>
            
            <div class="mini-calendar-grid" id="calendarGrid">
                <!-- 요일/날짜 동적 생성 -->
            </div>
            
            <div class="datepicker-footer">
                <div class="datepicker-selected"></div>
                <div class="datepicker-actions">
                    <button class="datepicker-btn" data-action="clear">Clear</button>
                    <button class="datepicker-btn apply" data-action="apply">Apply</button>
                </div>
            </div>
        `;
    }
    
    createDualCalendarHTML() {
        return `
            <button class="datepicker-close">×</button>
            
            <div class="calendar-side">
                <div class="mini-calendar-header">
                    <div class="mini-calendar-title">
                        <span>2025.06</span>
                    </div>
                    <div class="mini-calendar-controls">
                        <button class="nav-prev">‹</button>
                        <button class="nav-next">›</button>
                    </div>
                </div>
                <div class="mini-calendar-grid" data-side="left">
                    <!-- 요일/날짜 동적 생성 -->
                </div>
            </div>
            
            <div class="calendar-side">
                <div class="mini-calendar-header">
                    <div class="mini-calendar-title">
                        <span>2025.07</span>
                    </div>
                    <div class="mini-calendar-controls">
                        <button class="nav-prev">‹</button>
                        <button class="nav-next">›</button>
                    </div>
                </div>
                <div class="mini-calendar-grid" data-side="right">
                    <!-- 요일/날짜 동적 생성 -->
                </div>
            </div>
            
            <div class="datepicker-footer">
                <div class="datepicker-selected"></div>
                <div class="datepicker-actions">
                    <button class="datepicker-btn" data-action="clear">Clear</button>
                    <button class="datepicker-btn apply" data-action="apply">Apply</button>
                </div>
            </div>
        `;
    }
    

    
    bindEvents() {
        // 닫기 버튼
        this.picker.querySelector('.datepicker-close').onclick = () => this.close();
        
        // ESC 키로 닫기
        this.escKeyHandler = (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('show')) {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escKeyHandler);
        
        if (this.options.mode === 'range') {
            this.bindDualCalendarEvents();
        } else {
            this.bindSingleCalendarEvents();
        }
        
        // 액션 버튼들
        this.picker.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'clear') {
                this.clear();
            } else if (action === 'apply') {
                this.apply();
            }
        });
    }
    
    bindSingleCalendarEvents() {
        // 네비게이션 버튼들 (MiniCalendarComponent_04.html과 동일한 로직)
        this.picker.querySelector('#prevBtn').onclick = () => {
            const base = new Date(2025, 8, 1); // 2025-09-01
            const nextBlock = new Date(base);
            nextBlock.setDate(base.getDate() + 28); // 2025-09-29
            if (this.currentDate < base) {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            } else if (this.currentDate >= base && this.currentDate < nextBlock) {
                // 9월 1일이면 4주 빼서 8월로 이동 (월요일로 보정)
                const day = this.currentDate.getDay();
                const diffToMonday = (day === 0 ? -6 : 1 - day);
                let monday = new Date(this.currentDate);
                monday.setDate(this.currentDate.getDate() + diffToMonday);
                monday.setDate(monday.getDate() - 28);
                this.currentDate = monday;
            } else if (this.currentDate < nextBlock) {
                this.currentDate = new Date(base);
            } else {
                const day = this.currentDate.getDay();
                const diffToMonday = (day === 0 ? -6 : 1 - day);
                let monday = new Date(this.currentDate);
                monday.setDate(this.currentDate.getDate() + diffToMonday);
                monday.setDate(monday.getDate() - 28);
                this.currentDate = monday;
            }
            this.render();
        };
        
        this.picker.querySelector('#nextBtn').onclick = () => {
            const base = new Date(2025, 8, 1); // 2025-09-01
            const nextBlock = new Date(base);
            nextBlock.setDate(base.getDate() + 28); // 2025-09-29
            if (this.currentDate < base) {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            } else if (this.currentDate >= base && this.currentDate < nextBlock) {
                this.currentDate = new Date(nextBlock);
            } else {
                const day = this.currentDate.getDay();
                const diffToMonday = (day === 0 ? -6 : 1 - day);
                let monday = new Date(this.currentDate);
                monday.setDate(this.currentDate.getDate() + diffToMonday);
                monday.setDate(monday.getDate() + 28);
                this.currentDate = monday;
            }
            this.render();
        };
    }
    
    bindDualCalendarEvents() {
        // 네비게이션 버튼 이벤트 (간단한 월별 이동)
        this.picker.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-prev')) {
                // 이전 월로 이동
                this.leftDate.setMonth(this.leftDate.getMonth() - 1);
                this.rightDate.setMonth(this.rightDate.getMonth() - 1);
                this.render();
            } else if (e.target.classList.contains('nav-next')) {
                // 다음 월로 이동
                this.leftDate.setMonth(this.leftDate.getMonth() + 1);
                this.rightDate.setMonth(this.rightDate.getMonth() + 1);
                this.render();
            }
        });
    }
    

    

    
    isAfterReferenceDate(date) {
        return date >= this.REFERENCE_DATE;
    }
    
    render() {
        // 기간 선택 모드일 때는 듀얼 달력으로 렌더링
        if (this.options.mode === 'range') {
            this.renderDualCalendar();
            return;
        }
        
        const grid = this.picker.querySelector('#calendarGrid');
        const header = this.picker.querySelector('#calendarYearMonth');
        const titleDiv = this.picker.querySelector('.mini-calendar-title');
        
        grid.innerHTML = '';
        
        // 요일 헤더
        this.weekDays.forEach((d, i) => {
            const wd = document.createElement('div');
            wd.className = 'mini-calendar-weekday';
            if (i === 5) wd.style.color = '#0070c0';
            if (i === 6) wd.style.color = '#e74c3c';
            wd.textContent = d;
            grid.appendChild(wd);
        });
        
        // 현재 월/4주 정보
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const base = new Date(2025, 8, 1); // 2025-09-01
        const nextBlock = new Date(base);
        nextBlock.setDate(base.getDate() + 28); // 2025-09-29
        
        if (this.isAfterReferenceDate(this.currentDate)) {
            // 4주 단위 로직 (기준일 이후)
            let startDate;
            if (this.currentDate >= base && this.currentDate < nextBlock) {
                startDate = new Date(2025, 7, 25); // 2025-08-25 (월)
            } else {
                // currentDate가 속한 주의 월요일에서 1주 전(7일 전)으로 startDate 설정
                let start = new Date(this.currentDate);
                let day = start.getDay();
                let diffToMonday = (day === 0 ? -6 : 1 - day);
                start.setDate(start.getDate() + diffToMonday - 7);
                startDate = new Date(start);
            }
            
            // 날짜 범위 업데이트 (중간 4주만 표시)
            let displayStartDate = new Date(startDate);
            displayStartDate.setDate(displayStartDate.getDate() + 7); // 첫 주 제외
            let displayEndDate = new Date(displayStartDate);
            displayEndDate.setDate(displayStartDate.getDate() + 27); // 4주
            header.textContent = `${displayStartDate.getFullYear()}.${String(displayStartDate.getMonth()+1).padStart(2,'0')}.${String(displayStartDate.getDate()).padStart(2,'0')} ~ ${displayEndDate.getFullYear()}.${String(displayEndDate.getMonth()+1).padStart(2,'0')}.${String(displayEndDate.getDate()).padStart(2,'0')}`;
            titleDiv.classList.add('small');
            
            // 표시할 주 수 계산 (4주 달력용) - 항상 6주 고정으로 설정
            const isFixedWeeks = true; // 팝업에서는 항상 6주 고정
            let weeksToShow = 6; // 기본 6주 (첫주, 4주, 마지막주)
            if (!isFixedWeeks) {
                weeksToShow = 4; // 중간 4주만 표시
            }
            
            const totalDays = weeksToShow === 6 ? 42 : 28;
            const startIndex = weeksToShow === 6 ? 0 : 7; // 6주면 0부터, 4주면 7부터
            
            // 먼저 모든 날짜 데이터를 수집
            const allDays = [];
            for (let i = startIndex; i < startIndex + totalDays; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                allDays.push({
                    date: d,
                    index: i,
                    isActive: weeksToShow === 4 || (i >= 7 && i < 35)
                });
            }
            
            // 활성화된 날짜들만 필터링하여 월별 그룹 생성
            const activeDays = allDays.filter(day => day.isActive);
            const monthGroups = {};
            
            activeDays.forEach(day => {
                const monthKey = `${day.date.getFullYear()}-${day.date.getMonth()}`;
                if (!monthGroups[monthKey]) {
                    monthGroups[monthKey] = [];
                }
                monthGroups[monthKey].push(day);
            });
            
            // 월별 날짜 수 계산하여 주도권 결정
            const monthCounts = {};
            let dominantMonth = null;
            let maxCount = 0;
            let earliestMonth = null;
            
            Object.keys(monthGroups).forEach(monthKey => {
                const group = monthGroups[monthKey];
                monthCounts[monthKey] = group.length;
                
                if (group.length > maxCount) {
                    maxCount = group.length;
                    dominantMonth = monthKey;
                    earliestMonth = monthKey;
                } else if (group.length === maxCount) {
                    // 동점인 경우 더 이른 월을 선택
                    if (!earliestMonth || monthKey < earliestMonth) {
                        dominantMonth = monthKey;
                        earliestMonth = monthKey;
                    }
                }
            });
            
            // 주도권을 가진 월의 날짜에만 경계선 적용
            Object.keys(monthGroups).forEach(monthKey => {
                const group = monthGroups[monthKey];
                const isDominant = (monthKey === dominantMonth);
                
                group.forEach((day, dayIndex) => {
                    // 모든 날짜에 기본 그룹 스타일 적용
                    day.hasGroupStyle = true;
                    
                    // 주도권을 가진 월에만 경계선 적용
                    if (isDominant) {
                        const gridIndex = day.index;
                        const dayOfWeek = (day.date.getDay() + 6) % 7; // 월요일=0
                        
                        // 월 그룹의 경계선 설정
                        day.needsTopBorder = false;
                        day.needsBottomBorder = false;
                        day.needsLeftBorder = false;
                        day.needsRightBorder = false;
                        
                        // 4주 모드와 6주 모드에 따른 경계 범위 설정
                        const activeStart = weeksToShow === 6 ? 7 : startIndex;
                        const activeEnd = weeksToShow === 6 ? 35 : (startIndex + totalDays);
                        
                        // 위쪽 경계선 체크
                        const upperIndex = gridIndex - 7;
                        if (upperIndex < activeStart || upperIndex >= activeEnd) {
                            // 위쪽이 비활성 영역인 경우
                            day.needsTopBorder = true;
                        } else {
                            // allDays에서 해당 인덱스 찾기
                            const upperDay = allDays.find(d => d.index === upperIndex);
                            if (upperDay && upperDay.isActive && upperDay.date.getMonth() !== day.date.getMonth()) {
                                day.needsTopBorder = true;
                            }
                        }
                        
                        // 아래쪽 경계선 체크
                        const lowerIndex = gridIndex + 7;
                        if (lowerIndex >= activeStart && lowerIndex < activeEnd) {
                            const lowerDay = allDays.find(d => d.index === lowerIndex);
                            if (lowerDay && lowerDay.isActive && lowerDay.date.getMonth() !== day.date.getMonth()) {
                                day.needsBottomBorder = true;
                            }
                        } else if (lowerIndex >= activeEnd) {
                            // 아래쪽이 비활성 영역인 경우
                            day.needsBottomBorder = true;
                        }
                        
                        // 왼쪽 경계선 체크
                        if (dayOfWeek === 0) {
                            // 월요일인 경우
                            day.needsLeftBorder = true;
                        } else {
                            const leftIndex = gridIndex - 1;
                            const leftDay = allDays.find(d => d.index === leftIndex);
                            if (leftDay && leftDay.isActive && leftDay.date.getMonth() !== day.date.getMonth()) {
                                day.needsLeftBorder = true;
                            }
                        }
                        
                        // 오른쪽 경계선 체크
                        if (dayOfWeek === 6) {
                            // 일요일인 경우
                            day.needsRightBorder = true;
                        } else {
                            const rightIndex = gridIndex + 1;
                            const rightDay = allDays.find(d => d.index === rightIndex);
                            if (rightDay && rightDay.isActive && rightDay.date.getMonth() !== day.date.getMonth()) {
                                day.needsRightBorder = true;
                            }
                        }
                    } else {
                        // 비주도권 월은 월별 경계선 없음
                        day.needsTopBorder = false;
                        day.needsBottomBorder = false;
                        day.needsLeftBorder = false;
                        day.needsRightBorder = false;
                    }
                    
                    // 모든 날짜에 전체 활성 영역의 외곽 라인 추가 적용
                    const gridIndex = day.index;
                    const dayOfWeek = (day.date.getDay() + 6) % 7; // 월요일=0
                    
                    // 활성 영역의 경계 설정
                    const topBoundary = weeksToShow === 6 ? [7, 13] : [startIndex, startIndex + 6];
                    const bottomBoundary = weeksToShow === 6 ? [28, 34] : [startIndex + totalDays - 7, startIndex + totalDays - 1];
                    
                    // 맨 위쪽 행에 상단 라인 추가
                    if (gridIndex >= topBoundary[0] && gridIndex <= topBoundary[1]) {
                        day.needsTopBorder = true;
                    }
                    
                    // 맨 아래쪽 행에 하단 라인 추가
                    if (gridIndex >= bottomBoundary[0] && gridIndex <= bottomBoundary[1]) {
                        day.needsBottomBorder = true;
                    }
                    
                    // 맨 왼쪽 열 (월요일 위치)에 좌측 라인 추가
                    if (dayOfWeek === 0) {
                        day.needsLeftBorder = true;
                    }
                    
                    // 맨 오른쪽 열 (일요일 위치)에 우측 라인 추가
                    if (dayOfWeek === 6) {
                        day.needsRightBorder = true;
                    }
                });
            });
            
            // 실제 DOM 생성
            for (let i = 0; i < allDays.length; i++) {
                const dayData = allDays[i];
                const d = dayData.date;
                const cell = document.createElement('div');
                cell.className = 'mini-calendar-day';
                
                if (!dayData.isActive) {
                    // 첫 주(0~6), 마지막 주(35~41)는 비활성화(회색), 날짜는 표시하지만 클릭은 가능
                    cell.classList.add('disabled');
                    cell.textContent = d.getDate();
                    
                    // 선택 상태 표시 (비활성 날짜도 선택 가능)
                    if (this.options.mode === 'single') {
                        if (this.selectedDate && d.getTime() === this.selectedDate.getTime()) {
                            cell.classList.add('selected');
                        }
                    } else {
                        if (this.startDate && d.getTime() === this.startDate.getTime()) {
                            cell.classList.add('range-start');
                        }
                        if (this.endDate && d.getTime() === this.endDate.getTime()) {
                            cell.classList.add('range-end');
                        }
                        if (this.isDateInRange(d) && 
                            (!this.startDate || d.getTime() !== this.startDate.getTime()) && 
                            (!this.endDate || d.getTime() !== this.endDate.getTime())) {
                            cell.classList.add('in-range');
                        }
                    }
                    
                    // 비활성 날짜도 클릭 가능하도록 이벤트 추가
                    cell.addEventListener('click', () => {
                        this.handleDateClick(new Date(d));
                    });
                } else {
                    // 가운데 4주만 활성화
                    if (d.getDay() === 6) cell.classList.add('saturday');
                    if (d.getDay() === 0) cell.classList.add('sunday');
                    
                    const today = new Date();
                    if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
                        cell.classList.add('today');
                    }
                    
                    // 선택 상태 표시
                    if (this.options.mode === 'single') {
                        if (this.selectedDate && d.getTime() === this.selectedDate.getTime()) {
                            cell.classList.add('selected');
                        }
                    } else {
                        if (this.startDate && d.getTime() === this.startDate.getTime()) {
                            cell.classList.add('range-start');
                        }
                        if (this.endDate && d.getTime() === this.endDate.getTime()) {
                            cell.classList.add('range-end');
                        }
                        if (this.isDateInRange(d) && 
                            (!this.startDate || d.getTime() !== this.startDate.getTime()) && 
                            (!this.endDate || d.getTime() !== this.endDate.getTime())) {
                            cell.classList.add('in-range');
                        }
                    }
                    
                    // 월 그룹 라인 스타일 적용
                    if (dayData.hasGroupStyle) {
                        cell.classList.add('month-group');
                        
                        if (dayData.needsTopBorder) cell.classList.add('month-top');
                        if (dayData.needsBottomBorder) cell.classList.add('month-bottom');
                        if (dayData.needsLeftBorder) cell.classList.add('month-left');
                        if (dayData.needsRightBorder) cell.classList.add('month-right');
                    }
                    
                    cell.textContent = d.getDate();
                    
                    cell.addEventListener('click', () => {
                        this.handleDateClick(new Date(d));
                    });
                }
                grid.appendChild(cell);
            }
        } else {
            // 월 단위
            header.textContent = `${year}.${String(month+1).padStart(2,'0')}`;
            titleDiv.classList.remove('small');
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month+1, 0);
            let start = new Date(firstDay);
            let firstDayOfWeek = (firstDay.getDay() + 6) % 7; // 월요일=0
            start.setDate(start.getDate() - firstDayOfWeek);
            // 표시할 주 수 계산 - 팝업에서는 항상 6주 고정
            const isFixedWeeks = true; // 팝업에서는 항상 6주 고정
            let weeksToShow = 6; // 기본 6주
            if (!isFixedWeeks) {
                // 해당 월만 표시하기 위한 최소 주 수 계산
                const lastDayOfWeek = (lastDay.getDay() + 6) % 7; // 월요일=0
                const daysFromStart = firstDayOfWeek + lastDay.getDate();
                weeksToShow = Math.ceil(daysFromStart / 7);
            }
            
            const totalDays = weeksToShow * 7;
            for (let i=0; i<totalDays; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const cell = document.createElement('div');
                cell.className = 'mini-calendar-day';
                if (d < firstDay || d > lastDay) {
                    cell.classList.add('other-month');
                    cell.textContent = d.getDate();
                    
                    // other-month 날짜도 선택 가능하도록 처리
                    if (d.getDay() === 6) cell.classList.add('saturday');
                    if (d.getDay() === 0) cell.classList.add('sunday');
                    const today = new Date();
                    if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
                        cell.classList.add('today');
                    }
                    
                    // 선택 상태 표시 (other-month 날짜도 선택 가능)
                    if (this.options.mode === 'single') {
                        if (this.selectedDate && d.getTime() === this.selectedDate.getTime()) {
                            cell.classList.add('selected');
                        }
                    } else {
                        if (this.startDate && d.getTime() === this.startDate.getTime()) {
                            cell.classList.add('range-start');
                        }
                        if (this.endDate && d.getTime() === this.endDate.getTime()) {
                            cell.classList.add('range-end');
                        }
                        if (this.isDateInRange(d) && 
                            (!this.startDate || d.getTime() !== this.startDate.getTime()) && 
                            (!this.endDate || d.getTime() !== this.endDate.getTime())) {
                            cell.classList.add('in-range');
                        }
                    }
                    
                    // other-month 날짜도 클릭 가능하도록 이벤트 추가
                    cell.addEventListener('click', () => {
                        this.handleDateClick(new Date(d));
                    });
                } else {
                    if (d.getDay() === 6) cell.classList.add('saturday');
                    if (d.getDay() === 0) cell.classList.add('sunday');
                    const today = new Date();
                    if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
                        cell.classList.add('today');
                    }
                    
                    // 선택 상태 표시
                    if (this.options.mode === 'single') {
                        if (this.selectedDate && d.getTime() === this.selectedDate.getTime()) {
                            cell.classList.add('selected');
                        }
                    } else {
                        if (this.startDate && d.getTime() === this.startDate.getTime()) {
                            cell.classList.add('range-start');
                        }
                        if (this.endDate && d.getTime() === this.endDate.getTime()) {
                            cell.classList.add('range-end');
                        }
                        if (this.isDateInRange(d) && 
                            (!this.startDate || d.getTime() !== this.startDate.getTime()) && 
                            (!this.endDate || d.getTime() !== this.endDate.getTime())) {
                            cell.classList.add('in-range');
                        }
                    }
                    
                    cell.textContent = d.getDate();
                    cell.addEventListener('click', () => {
                        this.handleDateClick(new Date(d));
                    });
                }
                grid.appendChild(cell);
            }
        }
        
        this.updateSelectedDisplay();
    }
    
    handleDateClick(date) {
        if (this.options.mode === 'single') {
            this.selectedDate = date;
            this.updateSelectedDisplay();
            if (this.options.onSelect) {
                this.options.onSelect(date);
            }
        } else {
            if (!this.startDate || (this.startDate && this.endDate)) {
                this.startDate = date;
                this.endDate = null;
            } else if (this.startDate && !this.endDate) {
                if (date < this.startDate) {
                    this.endDate = this.startDate;
                    this.startDate = date;
                } else {
                    this.endDate = date;
                }
                
                if (this.options.onSelect) {
                    this.options.onSelect(this.startDate, this.endDate);
                }
            }
        }
        
        this.render();
    }
    
    isDateInRange(date) {
        if (this.options.mode === 'single') return false;
        if (!this.startDate || !this.endDate) return false;
        return date >= this.startDate && date <= this.endDate;
    }
    
    updateSelectedDisplay() {
        const display = this.picker.querySelector('.datepicker-selected');
        
        if (this.options.mode === 'single') {
            if (this.selectedDate) {
                display.textContent = this.formatDateForDisplay(this.selectedDate);
            } else {
                display.textContent = '날짜를 선택하세요';
            }
        } else {
            if (this.startDate && this.endDate) {
                display.textContent = `${this.formatDateForDisplay(this.startDate)} - ${this.formatDateForDisplay(this.endDate)}`;
            } else if (this.startDate) {
                display.textContent = `${this.formatDateForDisplay(this.startDate)} - `;
            } else {
                display.textContent = '날짜를 선택하세요';
            }
        }
    }
    
    renderDualCalendar() {
        // 헤더 텍스트 업데이트 (기존 로직 적용)
        this.updateDualCalendarHeaders();
        
        // 왼쪽 달력 렌더링
        this.renderCalendarSide('left', this.leftDate);
        
        // 오른쪽 달력 렌더링
        this.renderCalendarSide('right', this.rightDate);
        
        this.updateSelectedDisplay();
    }
    
    updateDualCalendarHeaders() {
        // 왼쪽 달력 헤더 업데이트
        const leftTitleDiv = this.picker.querySelector('.calendar-side:first-child .mini-calendar-title');
        this.updateCalendarHeader(leftTitleDiv, this.leftDate);
        
        // 오른쪽 달력 헤더 업데이트
        const rightTitleDiv = this.picker.querySelector('.calendar-side:last-child .mini-calendar-title');
        this.updateCalendarHeader(rightTitleDiv, this.rightDate);
    }
    
    updateCalendarHeader(titleDiv, date) {
        // 기간 선택 모드에서는 간단한 월별 표시
        const year = date.getFullYear();
        const month = date.getMonth();
        titleDiv.innerHTML = `<span>${year}.${String(month + 1).padStart(2, '0')}</span>`;
    }
    
    renderCalendarSide(side, date) {
        const grid = this.picker.querySelector(`[data-side="${side}"]`);
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // 요일 헤더
        this.weekDays.forEach((d, i) => {
            const wd = document.createElement('div');
            wd.className = 'mini-calendar-weekday';
            if (i === 5) wd.style.color = '#3b82f6';
            if (i === 6) wd.style.color = '#ef4444';
            wd.textContent = d;
            grid.appendChild(wd);
        });
        
        // 기간 선택 모드에서는 간단한 월별 달력 사용
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 첫 번째 날의 요일 (월요일=0)
        const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
        
        // 시작 날짜 (이전 달의 마지막 주 포함)
        const start = new Date(firstDay);
        start.setDate(start.getDate() - firstDayOfWeek);
        
        // 6주 고정으로 표시
        const totalDays = 42;
        for (let i = 0; i < totalDays; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const cell = document.createElement('div');
            cell.className = 'mini-calendar-day';
            
            if (d < firstDay || d > lastDay) {
                cell.classList.add('other-month');
            } else {
                if (d.getDay() === 6) cell.classList.add('saturday');
                if (d.getDay() === 0) cell.classList.add('sunday');
                const today = new Date();
                if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
                    cell.classList.add('today');
                }
            }
            
            // 범위 선택 상태 표시
            if (this.startDate && d.getTime() === this.startDate.getTime()) {
                cell.classList.add('range-start');
            }
            if (this.endDate && d.getTime() === this.endDate.getTime()) {
                cell.classList.add('range-end');
            }
            if (this.isDateInRange(d) && 
                (!this.startDate || d.getTime() !== this.startDate.getTime()) && 
                (!this.endDate || d.getTime() !== this.endDate.getTime())) {
                cell.classList.add('in-range');
            }
            
            cell.textContent = d.getDate();
            cell.addEventListener('click', () => {
                this.handleDateClick(new Date(d));
            });
            
            grid.appendChild(cell);
        }
    }
    
    formatDate(date) {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    
    formatDateForDisplay(date) {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    open(inputElement) {
        this.currentInputElement = inputElement;
        
        // 기존 입력값 파싱하여 날짜 복원
        const existingValue = inputElement.value.trim();
        
        if (this.options.mode === 'single') {
            if (existingValue && existingValue !== inputElement.placeholder) {
                // YYYY-MM-DD 형식 파싱
                const dateMatch = existingValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (dateMatch) {
                    const parsedDate = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
                    this.selectedDate = parsedDate;
                    this.currentDate = new Date(parsedDate);
                } else {
                    this.currentDate = new Date();
                    this.selectedDate = null;
                }
            } else {
                this.currentDate = new Date();
                this.selectedDate = null;
            }
        } else {
            // 기간 선택 모드
            if (existingValue && existingValue !== inputElement.placeholder && existingValue.includes(' ~ ')) {
                // YYYY-MM-DD ~ YYYY-MM-DD 형식 파싱
                const rangeParts = existingValue.split(' ~ ');
                if (rangeParts.length === 2) {
                    const startMatch = rangeParts[0].match(/^(\d{4})-(\d{2})-(\d{2})$/);
                    const endMatch = rangeParts[1].match(/^(\d{4})-(\d{2})-(\d{2})$/);
                    
                    if (startMatch && endMatch) {
                        this.startDate = new Date(parseInt(startMatch[1]), parseInt(startMatch[2]) - 1, parseInt(startMatch[3]));
                        this.endDate = new Date(parseInt(endMatch[1]), parseInt(endMatch[2]) - 1, parseInt(endMatch[3]));
                        this.leftDate = new Date(this.startDate);
                        this.rightDate = new Date(this.leftDate);
                        this.rightDate.setMonth(this.rightDate.getMonth() + 1);
                    } else {
                        this.leftDate = new Date();
                        this.rightDate = new Date(this.leftDate);
                        this.rightDate.setMonth(this.rightDate.getMonth() + 1);
                        this.startDate = null;
                        this.endDate = null;
                    }
                } else {
                    this.leftDate = new Date();
                    this.rightDate = new Date(this.leftDate);
                    this.rightDate.setMonth(this.rightDate.getMonth() + 1);
                    this.startDate = null;
                    this.endDate = null;
                }
            } else {
                this.leftDate = new Date();
                this.rightDate = new Date(this.leftDate);
                this.rightDate.setMonth(this.rightDate.getMonth() + 1);
                this.startDate = null;
                this.endDate = null;
            }
        }
        
        this.overlay.classList.add('show');
        this.positionPopup();
        this.render();
        
        // 외부 클릭 이벤트 추가 (약간의 지연을 두고 추가)
        setTimeout(() => {
            this.documentClickHandler = (e) => {
                if (this.overlay.classList.contains('show') && 
                    !this.picker.contains(e.target) && 
                    e.target !== this.currentInputElement &&
                    !e.target.closest('.mini-calendar-day')) {
                    this.close();
                }
            };
            document.addEventListener('click', this.documentClickHandler);
        }, 200);
    }
    
    positionPopup() {
        if (!this.currentInputElement || !this.picker) return;
        
        const inputRect = this.currentInputElement.getBoundingClientRect();
        
        // input 박스 바로 아래에 위치 (스크롤 고려하지 않고 viewport 기준)
        let left = inputRect.left;
        const top = inputRect.bottom + 2; // 2px 간격
        
        // 화면 경계 체크
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const pickerHeight = 280; // 실제 팝업 높이에 맞게 조정
        const pickerWidth = this.options.mode === 'range' ? 430 : 205; // 듀얼/싱글 달력 너비
        
        let finalTop = top;
        
        // 팝업이 화면 아래로 벗어나면 input 위쪽에 표시
        if (top + pickerHeight > viewportHeight) {
            finalTop = inputRect.top - pickerHeight - 2;
        }
        
        // 팝업이 화면 오른쪽으로 벗어나면 왼쪽으로 조정
        if (left + pickerWidth > viewportWidth) {
            left = Math.max(10, viewportWidth - pickerWidth - 10);
        }
        
        // 오버레이를 투명하게 하고 picker를 fixed로 위치 설정
        this.overlay.style.background = 'transparent';
        this.picker.style.position = 'fixed';
        this.picker.style.left = left + 'px';
        this.picker.style.top = finalTop + 'px';
        this.picker.style.zIndex = '10001';
        this.picker.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }
    
    close() {
        this.overlay.classList.remove('show');
        this.overlay.style.background = 'rgba(0,0,0,0.3)'; // 원래 배경색 복원
        
        // document 클릭 이벤트 리스너 제거
        if (this.documentClickHandler) {
            document.removeEventListener('click', this.documentClickHandler);
            this.documentClickHandler = null;
        }
        
        this.currentInputElement = null;
        
        if (this.options.mode === 'single') {
            this.selectedDate = null;
        } else {
            this.startDate = null;
            this.endDate = null;
        }
    }
    
    clear() {
        if (this.options.mode === 'single') {
            this.selectedDate = null;
        } else {
            this.startDate = null;
            this.endDate = null;
        }
        this.render();
    }
    
    apply() {
        if (!this.currentInputElement) return;
        
        let value = '';
        
        if (this.options.mode === 'single') {
            if (this.selectedDate) {
                value = this.formatDateForDisplay(this.selectedDate);
                if (this.options.onApply) {
                    this.options.onApply(this.selectedDate);
                }
            }
        } else {
            if (this.startDate && this.endDate) {
                value = `${this.formatDateForDisplay(this.startDate)} ~ ${this.formatDateForDisplay(this.endDate)}`;
                if (this.options.onApply) {
                    this.options.onApply(this.startDate, this.endDate);
                }
            }
        }
        
        if (value) {
            this.currentInputElement.value = value;
            this.currentInputElement.classList.remove('placeholder');
            this.currentInputElement.classList.add('has-value');
        }
        
        this.close();
    }
    
    destroy() {
        // 이벤트 리스너 정리
        if (this.documentClickHandler) {
            document.removeEventListener('click', this.documentClickHandler);
        }
        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
        }
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// 전역 함수로 쉽게 사용할 수 있도록
window.DatePickerComponent = DatePickerComponent;

// 간편 사용 함수들
window.createSingleDatePicker = function(options = {}) {
    return new DatePickerComponent({
        mode: 'single',
        ...options
    });
};

window.createRangeDatePicker = function(options = {}) {
    return new DatePickerComponent({
        mode: 'range',
        ...options
    });
};