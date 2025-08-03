class DatePickerComponent {
    constructor(options = {}) {
        this.options = {
            mode: 'single', // 'single' 또는 'range'
            format: 'YYYYMMDD',
            showWeekNumbers: true, // 주차 표시 옵션 (기본값: true)
            onSelect: null,
            onApply: null,
            ...options
        };
        
        this.startDate = null;
        this.endDate = null;
        this.selectedDate = null;
        this.currentDate = new Date();
        this.currentInputElement = null;
        this.overlay = null;
        this.picker = null;
        // this.REFERENCE_DATE = new Date(2025, 8, 1); // 2025-09-01 - 공통 파일로 이동
        
        // this.weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; - 공통 파일로 이동
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
            /* ===== CSS 통합 완료 ===== */
            /* 모든 스타일이 common.css로 통합되었습니다. */
            /* 팝업 달력은 .mini-calendar-container.popup-compact 클래스를 사용합니다. */
            
            /* ===== 향상된 년/월 선택기 스타일 ===== */
            .calendar-ym-trigger {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                cursor: pointer;
            }
            
            .calendar-ym-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                background: #3b82f6;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(59,130,246,0.15);
                transition: background 0.18s, transform 0.18s;
                margin-left: 2px;
                transform-origin: center;
            }
            
            .calendar-ym-trigger:hover .calendar-ym-icon {
                background: #2563eb;
                transform: scale(1.05);
            }
            
            .calendar-ym-trigger:active .calendar-ym-icon {
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'datepicker-overlay';
        
        this.picker = document.createElement('div');
        // 통합된 클래스 사용: popup-compact
        this.picker.className = 'mini-calendar-container popup-compact';
        this.picker.style.position = 'relative';
        
        this.picker.innerHTML = this.createSingleCalendarHTML();
        
        this.overlay.appendChild(this.picker);
        document.body.appendChild(this.overlay);
        
        this.bindEvents();
    }
    
    createSingleCalendarHTML() {
        return `
            <button class="datepicker-close">×</button>
            
            <div class="mini-calendar-header">
                <div class="mini-calendar-title">
                    <span class="calendar-ym-trigger" id="calendarYmTrigger">
                        <span class="calendar-ym-icon">
                            <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                                <path d="M4 5l2 2 2-2" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        <span id="calendarYearMonth">2025.06</span>
                    </span>
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
        
        this.bindSingleCalendarEvents();
        
        // 초기 년도/월 헤더 클릭 이벤트 바인딩
        this.rebindHeaderClickEvent();
    }
    
    bindSingleCalendarEvents() {
        // 공통 로직 사용
        const { moveToPreviousDate, moveToNextDate } = CalendarCore;
        
        // 네비게이션 버튼들 (공통 로직 사용)
        this.picker.querySelector('#prevBtn').onclick = () => {
            this.currentDate = moveToPreviousDate(this.currentDate);
            this.render();
        };
        
        this.picker.querySelector('#nextBtn').onclick = () => {
            this.currentDate = moveToNextDate(this.currentDate);
            this.render();
        };

        // 년도/월 헤더 클릭 이벤트는 rebindHeaderClickEvent()에서 처리
    }

    

    

    
    // function isAfterReferenceDate(date) { - 공통 파일로 이동
    //     return date >= this.REFERENCE_DATE;
    // }
    
    render() {
        if (!this.picker) return;
        
        // CalendarCore 로딩 확인
        if (typeof CalendarCore === 'undefined') {
            console.error('CalendarCore.js 파일을 로드할 수 없습니다.');
            return;
        }

        console.log('✅ CalendarCore 로딩 성공 (DatePicker):', CalendarCore);

        // 공통 updateCalendarOnly 함수 사용
        this.updateCalendarOnly();
    }

    rebindHeaderClickEvent() {
        const triggerElement = this.picker.querySelector('.calendar-ym-trigger');
        if (triggerElement && !triggerElement.hasAttribute('data-click-bound')) {
            triggerElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleYearMonthPicker();
            });
            triggerElement.setAttribute('data-click-bound', 'true');
        }
    }

    // ===== 주차 계산 함수 (ISO 8601 기준) =====
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    // ===== 년도/월 빠른 선택 기능 =====
    toggleYearMonthPicker() {
        // DatePicker는 기존 코드 유지 (팝업 위치 문제로 인해)
        console.log('[DatePicker] 기존 코드 사용');
        const existingPicker = this.picker.querySelector('.year-month-picker');
        if (existingPicker) {
            this.hideYearMonthPicker();
        } else {
            this.showYearMonthPicker();
        }
    }

    showYearMonthPicker() {
        // 기존 피커가 있으면 제거
        const existingPicker = this.picker.querySelector('.year-month-picker');
        if (existingPicker) {
            existingPicker.remove();
        }

        // 년도/월 선택 오버레이 생성
        const pickerElement = document.createElement('div');
        pickerElement.className = 'year-month-picker';
        pickerElement.innerHTML = `
            <div class="year-month-content">
                ${this.createYearMonthPickerHTML()}
            </div>
        `;

        // 달력 컨테이너에 추가 (그리드 영역에 오버레이)
        this.picker.appendChild(pickerElement);

        // 기존 네비게이션 버튼들 비활성화
        this.disableNavigation(true);

        // 애니메이션을 위한 약간의 지연
        setTimeout(() => {
            pickerElement.classList.add('show');
        }, 10);

        // 이벤트 바인딩
        this.bindYearMonthPickerEvents(pickerElement);

        // 외부 클릭 시 닫기 (오버레이 배경 클릭)
        this.yearMonthClickHandler = (e) => {
            const titleElement = this.picker.querySelector('.mini-calendar-title');
            const contentElement = pickerElement.querySelector('.year-month-content');
            
            // 년도/월 선택 컨텐츠 내부를 클릭한 경우 - 닫지 않음
            if (contentElement && contentElement.contains(e.target)) {
                return;
            }
            
            // 헤더 타이틀을 클릭한 경우 - 닫지 않음 (토글 기능)
            if (titleElement && titleElement.contains(e.target)) {
                return;
            }
            
            // 그 외의 모든 영역 클릭 시 - 닫기 (오버레이 배경 포함)
            this.hideYearMonthPicker();
        };
        document.addEventListener('click', this.yearMonthClickHandler);
    }



    disableNavigation(disable) {
        const navButtons = this.picker.querySelectorAll('#prevBtn, #nextBtn, .nav-prev, .nav-next');
        navButtons.forEach(btn => {
            if (disable) {
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.5';
            } else {
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
            }
        });
    }

    hideYearMonthPicker() {
        const pickerElement = this.picker.querySelector('.year-month-picker');
        if (pickerElement) {
            pickerElement.remove();
        }
        
        // 네비게이션 버튼들 다시 활성화
        this.disableNavigation(false);
        
        // 이벤트 리스너 제거
        if (this.yearMonthClickHandler) {
            document.removeEventListener('click', this.yearMonthClickHandler);
            this.yearMonthClickHandler = null;
        }
    }

    createYearMonthPickerHTML() {
        const currentYear = this.currentDate.getFullYear();
        const currentMonth = this.currentDate.getMonth();
        
        // 년도 범위 (현재 년도 ±3년)
        const yearRange = [];
        for (let i = currentYear - 3; i <= currentYear + 3; i++) {
            yearRange.push(i);
        }

        // 월 이름
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                          '7월', '8월', '9월', '10월', '11월', '12월'];

        return `
            <div class="year-picker">
                <div class="year-picker-title">년도</div>
                <div class="year-picker-grid">
                    ${yearRange.map(year => `
                        <button class="year-picker-item ${year === currentYear ? 'current' : ''}" 
                                data-year="${year}">${year}</button>
                    `).join('')}
                </div>
            </div>
            
            <div class="month-picker">
                <div class="month-picker-title">월</div>
                <div class="month-picker-grid">
                    ${monthNames.map((month, index) => `
                        <button class="month-picker-item ${index === currentMonth ? 'current' : ''}" 
                                data-month="${index}">${month}</button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    bindYearMonthPickerEvents(pickerElement) {
        // 년도/월 선택 이벤트
        pickerElement.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            
            if (e.target.classList.contains('year-picker-item')) {
                const selectedYear = parseInt(e.target.dataset.year);
                
                // 선택 피드백 효과
                this.showSelectionFeedback(e.target);
                
                this.currentDate.setFullYear(selectedYear);
                
                // 약간의 지연 후 업데이트 (피드백 효과를 보여주기 위해)
                setTimeout(() => {
                    this.hideYearMonthPicker();
                    this.updateCalendarOnly();
                }, 300);
            }
            
            if (e.target.classList.contains('month-picker-item')) {
                const selectedMonth = parseInt(e.target.dataset.month);
                
                // 선택 피드백 효과
                this.showSelectionFeedback(e.target);
                
                this.currentDate.setMonth(selectedMonth);
                
                // 약간의 지연 후 업데이트 (피드백 효과를 보여주기 위해)
                setTimeout(() => {
                    this.hideYearMonthPicker();
                    this.updateCalendarOnly();
                }, 300);
            }
        });
    }

    // 선택 피드백 효과
    showSelectionFeedback(element) {
        // 기존 피드백 효과 제거
        const existingEffects = element.querySelectorAll('.selection-ripple');
        existingEffects.forEach(effect => effect.remove());
        
        // 확산 효과 생성
        const ripple = document.createElement('div');
        ripple.className = 'selection-ripple';
        element.appendChild(ripple);
        
        // 체크마크 효과 생성
        const checkmark = document.createElement('div');
        checkmark.className = 'selection-checkmark';
        checkmark.innerHTML = '✓';
        element.appendChild(checkmark);
        
        // 애니메이션 트리거
        setTimeout(() => {
            ripple.classList.add('animate');
            checkmark.classList.add('animate');
        }, 10);
        
        // 정리
        setTimeout(() => {
            ripple.remove();
            checkmark.remove();
        }, 600);
    }

    // 년도/월 변경 시 달력만 업데이트하는 함수 (전체 팝업은 유지)
    updateCalendarOnly() {
        if (!this.picker) return;
        
        // 🆕 체크박스 상태 실시간 확인
        const rangeWeekNumbersCheckbox = document.getElementById('rangeWeekNumbers');
        const singleWeekNumbersCheckbox = document.getElementById('singleWeekNumbers');
        
        // 현재 활성화된 체크박스 상태 확인
        let currentShowWeekNumbers = this.options.showWeekNumbers;
        if (rangeWeekNumbersCheckbox && rangeWeekNumbersCheckbox.checked !== undefined) {
            currentShowWeekNumbers = rangeWeekNumbersCheckbox.checked;
        } else if (singleWeekNumbersCheckbox && singleWeekNumbersCheckbox.checked !== undefined) {
            currentShowWeekNumbers = singleWeekNumbersCheckbox.checked;
        }
        
        // 옵션 업데이트
        this.options.showWeekNumbers = currentShowWeekNumbers;
        
        const titleDiv = this.picker.querySelector('.mini-calendar-title span');
        const header = this.picker.querySelector('#calendarYearMonth');
        
        // CalendarCore 로딩 확인
        if (typeof CalendarCore === 'undefined') {
            console.error('CalendarCore.js 파일을 로드할 수 없습니다.');
            return;
        }

        // 공통 로직 변수들을 안전하게 할당
        const coreIsAfterRef = CalendarCore.isAfterReferenceDate;
        const coreGet4WeekStart = CalendarCore.get4WeekStartDate;
        const coreGet4WeekDispStart = CalendarCore.get4WeekDisplayStartDate;
        const coreGet4WeekDispEnd = CalendarCore.get4WeekDisplayEndDate;
        const coreFormatRange = CalendarCore.formatDateRange;
        const coreFormatMonth = CalendarCore.formatMonthDisplay;
        const coreMINI_WEEKDAYS = CalendarCore.MINI_WEEK_DAYS;
        
        if (coreIsAfterRef(this.currentDate)) {
            // 4주 단위 로직
            const startDate = coreGet4WeekStart(this.currentDate);
            const displayStartDate = coreGet4WeekDispStart(startDate);
            const displayEndDate = coreGet4WeekDispEnd(displayStartDate);
            
            if (header) {
            header.textContent = coreFormatRange(displayStartDate, displayEndDate);
            }
            if (titleDiv) {
            titleDiv.classList.add('small');
            }
            
            this.renderCalendarGrid(startDate, true); // 4주 모드
        } else {
            // 월 단위 로직
            if (header) {
                header.textContent = coreFormatMonth(this.currentDate);
            }
            if (titleDiv) {
                titleDiv.classList.remove('small');
            }
            
            this.renderCalendarGrid(this.currentDate, false); // 월 모드
        }
        
        this.updateSelectedDisplay();
        this.rebindHeaderClickEvent();
    }

    // 달력 그리드만 렌더링하는 공통 함수
    renderCalendarGrid(baseDate, is4WeekMode) {
        const grid = this.picker.querySelector('#calendarGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const coreMINI_WEEKDAYS = CalendarCore.MINI_WEEK_DAYS;
        
        // 주차 표시 옵션이 활성화된 경우에만 그리드 클래스 추가
        if (this.options.showWeekNumbers) {
            grid.classList.add('with-week-numbers');
        } else {
            grid.classList.remove('with-week-numbers');
        }
        
        // 주차 헤더 추가 (주차 표시 옵션이 활성화된 경우에만)
        if (this.options.showWeekNumbers) {
            const weekHeader = document.createElement('div');
            weekHeader.className = 'mini-calendar-weekday';
            weekHeader.textContent = 'W';
            weekHeader.style.fontSize = '0.9em';
            weekHeader.style.fontWeight = '600';
            weekHeader.style.color = '#6b7280';
            grid.appendChild(weekHeader);
        }
        
        // 요일 헤더 생성
        coreMINI_WEEKDAYS.forEach((d, i) => {
            const wd = document.createElement('div');
            wd.className = 'mini-calendar-weekday';
            if (i === 5) wd.style.color = '#ef4444';
            if (i === 6) wd.style.color = '#ef4444';
            wd.textContent = d;
            grid.appendChild(wd);
        });
            
        if (is4WeekMode) {
            // 4주 모드 렌더링 - MiniCalendarComponent_06 스타일 적용
            
            // 그리드에 월별 경계선 클래스 추가 (CSS gap 조정용)
            grid.classList.add('has-month-borders');
            console.log('🔍 4주 모드: 외곽 라인 활성화');
            
            // 모든 날짜 데이터를 수집
            const allDays = [];
            for (let i = 0; i < 42; i++) {
                const d = new Date(baseDate);
                d.setDate(baseDate.getDate() + i);
                allDays.push({
                    date: d,
                    index: i,
                    isActive: (i >= 7 && i < 35) // 가운데 4주만 활성화
                });
            }
            
            // 활성화된 날짜들에만 전체 활성 영역의 외곽 라인만 적용
            const activeDays = allDays.filter(day => day.isActive);
            
            activeDays.forEach(day => {
                // 모든 날짜에 기본 그룹 스타일 적용
                day.hasGroupStyle = true;
                
                // 전체 활성 영역의 외곽 라인만 적용 (월 변경 경계선 제거)
                const gridIndex = day.index;
                const dayOfWeek = (day.date.getDay() + 6) % 7; // 월요일=0
                
                // 활성 영역의 경계 설정
                const topBoundary = [7, 13];
                const bottomBoundary = [28, 34];
                
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
                
                // 초기화 (월 변경 경계선은 제거)
                day.needsTopBorder = day.needsTopBorder || false;
                day.needsBottomBorder = day.needsBottomBorder || false;
                day.needsLeftBorder = day.needsLeftBorder || false;
                day.needsRightBorder = day.needsRightBorder || false;
            });
            
            // 실제 DOM 생성
            for (let i = 0; i < allDays.length; i++) {
                const dayData = allDays[i];
                const d = dayData.date;
                
                // 주차 표시 옵션이 활성화된 경우, 각 주의 시작 부분에 주차 셀 추가
                if (this.options.showWeekNumbers && i % 7 === 0) {
                    const weekCell = document.createElement('div');
                    weekCell.className = 'mini-calendar-week';
                    weekCell.textContent = this.getWeekNumber(d);
                    weekCell.style.fontSize = '0.7em';
                    weekCell.style.color = '#666';
                    weekCell.style.fontWeight = 'bold';
                    grid.appendChild(weekCell);
                }
                
                const cell = document.createElement('div');
                cell.className = 'mini-calendar-day';
                
                if (!dayData.isActive) {
                    // 첫 주(0~6), 마지막 주(35~41)는 비활성화
                    cell.classList.add('disabled');
                    
                    // 비활성화된 날짜에서도 매월 1일은 월/일 표시
                    if (d.getDate() === 1) {
                        cell.innerHTML = `<span class="month-display">${d.getMonth() + 1}</span>/${d.getDate()}`;
                    } else {
                        cell.textContent = d.getDate();
                    }
                } else {
                    // 가운데 4주만 활성화 (기존 로직 유지)
                    
                    // 요일별 색상 적용
                    if (d.getDay() === 6) cell.classList.add('saturday');
                    if (d.getDay() === 0) cell.classList.add('sunday');
                        
                    // 오늘 날짜 표시
                    const today = new Date();
                    if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
                        cell.classList.add('today');
                    }
                        
                    // 선택된 날짜 체크
                    if (this.selectedDate && d.getFullYear() === this.selectedDate.getFullYear() && d.getMonth() === this.selectedDate.getMonth() && d.getDate() === this.selectedDate.getDate()) {
                        cell.classList.add('selected');
                    }
                        
                    // 범위 선택 체크
                    if (this.startDate && this.endDate) {
                        if (d >= this.startDate && d <= this.endDate) {
                            cell.classList.add('selected');
                        }
                    }
                    
                    // 외곽 라인 스타일 적용
                    if (dayData.hasGroupStyle) {
                        cell.classList.add('month-group');
                        
                        if (dayData.needsTopBorder) cell.classList.add('month-top');
                        if (dayData.needsBottomBorder) cell.classList.add('month-bottom');
                        if (dayData.needsLeftBorder) cell.classList.add('month-left');
                        if (dayData.needsRightBorder) cell.classList.add('month-right');
                    }
                        
                    // 4주 모드에서 매월 1일에 월/일 형식으로 표시
                    if (d.getDate() === 1) {
                        cell.innerHTML = `<span class="month-display">${d.getMonth() + 1}</span>/${d.getDate()}`;
                    } else {
                        cell.textContent = d.getDate();
                    }
                    
                    // 클릭 이벤트 추가
                    cell.addEventListener('click', () => this.handleDateClick(d));
                }
                
                grid.appendChild(cell);
            }
        } else {
            // 월 모드 렌더링
            const year = baseDate.getFullYear();
            const month = baseDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month+1, 0);
            let start = new Date(firstDay);
            let firstDayOfWeek = (firstDay.getDay() + 6) % 7; // 월요일=0
            start.setDate(start.getDate() - firstDayOfWeek);
            
            // 표시할 주 수 계산
            let weeksToShow = 6; // 기본 6주
            const lastDayOfWeek = (lastDay.getDay() + 6) % 7; // 월요일=0
            const daysFromStart = firstDayOfWeek + lastDay.getDate();
            weeksToShow = Math.ceil(daysFromStart / 7);
            
            const totalDays = weeksToShow * 7;
            
            // 날짜 셀 생성
            for (let i=0; i<totalDays; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                
                // 주차 표시 옵션이 활성화된 경우, 각 주의 시작 부분에 주차 셀 추가
                if (this.options.showWeekNumbers && i % 7 === 0) {
                    const weekCell = document.createElement('div');
                    weekCell.className = 'mini-calendar-week';
                    weekCell.textContent = this.getWeekNumber(d);
                    weekCell.style.fontSize = '0.7em';
                    weekCell.style.color = '#666';
                    weekCell.style.fontWeight = 'bold';
                    grid.appendChild(weekCell);
                }
                
                const cell = document.createElement('div');
                cell.className = 'mini-calendar-day';
                
                if (d < firstDay || d > lastDay) {
                    cell.classList.add('other-month');
                    cell.textContent = d.getDate();
                } else {
                    if (d.getDay() === 6) cell.classList.add('saturday');
                    if (d.getDay() === 0) cell.classList.add('sunday');
                    
                    const today = new Date();
                    if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
                        cell.classList.add('today');
                    }
                    
                    // 선택된 날짜 체크
                    if (this.selectedDate && d.getFullYear() === this.selectedDate.getFullYear() && d.getMonth() === this.selectedDate.getMonth() && d.getDate() === this.selectedDate.getDate()) {
                        cell.classList.add('selected');
                    }
                    
                    // 범위 선택 체크
                    if (this.startDate && this.endDate) {
                        if (d >= this.startDate && d <= this.endDate) {
                            cell.classList.add('selected');
                        }
                    }
                    
                    cell.textContent = d.getDate();
                    cell.addEventListener('click', () => this.handleDateClick(d));
                }
                grid.appendChild(cell);
            }
        }
    }
    
    handleDateClick(date) {
        if (this.options.mode === 'single') {
            this.selectedDate = date;
            this.updateSelectedDisplay();
            if (this.options.onSelect) {
                this.options.onSelect(date);
            }
            // 단일 날짜 선택 시 바로 적용
            this.apply();
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
                
                // 범위 선택 완료 시 바로 적용
                this.apply();
                return; // apply()에서 close()를 호출하므로 render() 불필요
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
        
        // 빠른기간선택 모드일 때는 .datepicker-selected 요소가 없을 수 있음
        if (!display) {
            return; // 안전하게 종료
        }
        
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
            // 기간 선택 모드 (싱글 달력에서 시작일→종료일 순서로 선택)
            if (existingValue && existingValue !== inputElement.placeholder && existingValue.includes(' ~ ')) {
                // YYYY-MM-DD ~ YYYY-MM-DD 형식 파싱
                const rangeParts = existingValue.split(' ~ ');
                if (rangeParts.length === 2) {
                    const startMatch = rangeParts[0].match(/^(\d{4})-(\d{2})-(\d{2})$/);
                    const endMatch = rangeParts[1].match(/^(\d{4})-(\d{2})-(\d{2})$/);
                    
                    if (startMatch && endMatch) {
                        this.startDate = new Date(parseInt(startMatch[1]), parseInt(startMatch[2]) - 1, parseInt(startMatch[3]));
                        this.endDate = new Date(parseInt(endMatch[1]), parseInt(endMatch[2]) - 1, parseInt(endMatch[3]));
                        this.currentDate = new Date(this.startDate);
                    } else {
                        this.currentDate = new Date();
                        this.startDate = null;
                        this.endDate = null;
                    }
                } else {
                    this.currentDate = new Date();
                    this.startDate = null;
                    this.endDate = null;
                }
            } else {
                this.currentDate = new Date();
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
        
        // 달력 너비 계산 (주차 표시 및 4주 모드 텍스트를 위해 20% 증가)
        const pickerWidth = 267; // 싱글 달력 너비 (281px → 267px, 5% 더 감소)
        
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
