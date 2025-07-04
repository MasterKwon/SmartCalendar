# 🛠️ SmartCalendar 개발자 가이드

> 개발자들이 각자의 언어로 재구현할 수 있도록 핵심 로직과 동작 원리를 상세히 설명합니다.

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [핵심 로직](#핵심-로직)
3. [4주 달력 전환 시스템](#4주-달력-전환-시스템)
4. [날짜 선택 컴포넌트](#날짜-선택-컴포넌트)
5. [빠른 기간 선택](#빠른-기간-선택)
6. [데이터 형식](#데이터-형식)
7. [이벤트 시스템](#이벤트-시스템)
8. [구현 시 고려사항](#구현-시-고려사항)

---

## 🎯 시스템 개요

### 목적
- **2025년 9월 1일 기준**으로 일반 달력과 4주 달력 간 자동 전환
- 빠른 기간 선택 기능 (오늘, 이번주, 이번달, 4주)
- 단일 날짜 및 기간 선택 지원
- 고객 시연용 프로토타입

### 핵심 특징
1. **하이브리드 달력**: 일반 달력 ↔ 4주 달력 자동 전환
2. **스마트 네비게이션**: 기준일에 따른 이동 로직 차별화
3. **이중 데이터 형식**: API용(YYYYMMDD) + 표시용(YYYY-MM-DD)
4. **콜백 기반 이벤트**: 선택, 완료, 오류 처리

---

## 🔧 핵심 로직

### 1. 기준일 시스템

```javascript
// 핵심 상수 (CalendarCore.js)
const REFERENCE_DATE = new Date(2025, 8, 1);  // 2025-09-01
const BASE_DATE = new Date(2025, 8, 1);       // 2025-09-01
const NEXT_BLOCK_DATE = new Date(2025, 8, 29); // 2025-09-29
```

**설명:**
- `REFERENCE_DATE`: 4주 달력 모드 시작 기준일
- `BASE_DATE`: 첫 번째 4주 블록 시작일
- `NEXT_BLOCK_DATE`: 두 번째 4주 블록 시작일 (BASE_DATE + 28일)

### 2. 달력 모드 판정 로직

```javascript
function isAfterReferenceDate(date) {
    return date >= REFERENCE_DATE;
}
```

**동작 원리:**
- 입력 날짜가 2025-09-01 이후인지 확인
- 이후면 4주 달력 모드, 이전이면 일반 달력 모드

### 3. 4주 블록 계산

```javascript
function get4WeekStartDate(currentDate) {
    if (isInSeptemberBlock(currentDate)) {
        // 9월 1일~28일 범위는 8월 25일(월)로 고정
        return new Date(2025, 7, 25);
    } else {
        // currentDate가 속한 주의 월요일에서 1주 전으로 설정
        const start = new Date(currentDate);
        const day = start.getDay();
        const diffToMonday = (day === 0 ? -6 : 1 - day);
        start.setDate(start.getDate() + diffToMonday - 7);
        return new Date(start);
    }
}
```

**설명:**
- 9월 1일~28일: 특별 처리로 8월 25일부터 시작
- 그 외: 해당 주의 월요일에서 1주 전부터 시작

---

## 📅 4주 달력 전환 시스템

### 1. 네비게이션 로직

#### 이전 기간 이동
```javascript
function moveToPreviousDate(currentDate) {
    if (currentDate < BASE_DATE) {
        // 9월 1일 이전: 월 단위 이동
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() - 1);
        return newDate;
    } else if (isAfterReferenceDate(currentDate)) {
        // 9월 1일 이후: 4주 단위 이동
        if (currentDate.getTime() === BASE_DATE.getTime()) {
            // 9월 1일이면 4주 빼서 8월로 이동
            return getPrevious4WeekMonday(currentDate);
        } else if (isInSeptemberBlock(currentDate)) {
            // 9월 1일~28일 범위 내면 9월 1일로 고정
            return new Date(BASE_DATE);
        } else {
            // 그 외는 4주 전으로 이동
            return getPrevious4WeekMonday(currentDate);
        }
    }
    return currentDate;
}
```

#### 다음 기간 이동
```javascript
function moveToNextDate(currentDate) {
    if (currentDate < BASE_DATE) {
        // 9월 1일 이전: 월 단위 이동
        const newDate = new Date(currentDate);
        
        // 8월에서 9월로 이동하는 경우 명시적으로 9월 1일로 설정
        if (currentDate.getFullYear() === 2025 && currentDate.getMonth() === 7) {
            return new Date(BASE_DATE); // 2025-09-01
        }
        
        newDate.setMonth(currentDate.getMonth() + 1);
        return newDate;
    } else if (isAfterReferenceDate(currentDate)) {
        // 9월 1일 이후: 4주 단위 이동
        const monday = getMondayOfWeek(currentDate);
        if (monday.getTime() < NEXT_BLOCK_DATE.getTime()) {
            // 9월 1일~28일 범위 내면 9월 29일로 이동
            return new Date(NEXT_BLOCK_DATE);
        } else {
            // 그 외는 4주 후로 이동
            return getNext4WeekMonday(currentDate);
        }
    }
    return currentDate;
}
```

### 2. 4주 블록 구조

```
2025.08.25 ~ 2025.09.21  # 첫 번째 4주 블록 (8월 25일부터)
2025.09.01 ~ 2025.09.28  # 두 번째 4주 블록 (9월 1일부터) ← 특별 처리
2025.09.29 ~ 2025.10.26  # 세 번째 4주 블록 (9월 29일부터)
2025.10.27 ~ 2025.11.23  # 네 번째 4주 블록 (10월 27일부터)
```

**특별 처리 사항:**
- 9월 1일~28일 블록은 화면에 첫 주(8월 25일~31일)를 제외하고 표시
- 실제로는 8월 25일부터 시작하지만, 사용자에게는 9월 1일부터 보임

---

## 🎯 날짜 선택 컴포넌트

### 1. 컴포넌트 구조

```javascript
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
        this.leftDate = new Date();  // 듀얼 달력용
        this.rightDate = new Date(); // 듀얼 달력용
    }
}
```

### 2. 렌더링 로직

```javascript
renderCalendarGrid(baseDate, is4WeekMode) {
    let startDate, endDate;
    
    if (is4WeekMode) {
        // 4주 달력 모드
        startDate = get4WeekStartDate(baseDate);
        const displayStartDate = get4WeekDisplayStartDate(startDate);
        const displayEndDate = get4WeekDisplayEndDate(displayStartDate);
        
        // 첫 주 제외하고 렌더링
        startDate = displayStartDate;
        endDate = displayEndDate;
    } else {
        // 일반 달력 모드
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    }
    
    // 달력 그리드 생성 로직...
}
```

### 3. 날짜 클릭 처리

```javascript
handleDateClick(date) {
    if (this.options.mode === 'single') {
        this.selectedDate = date;
        this.updateSelectedDisplay();
        
        if (this.options.onSelect) {
            this.options.onSelect(date);
        }
    } else {
        // 범위 선택 모드
        if (!this.startDate || (this.startDate && this.endDate)) {
            this.startDate = date;
            this.endDate = null;
        } else {
            if (date < this.startDate) {
                this.endDate = this.startDate;
                this.startDate = date;
            } else {
                this.endDate = date;
            }
        }
        this.updateSelectedDisplay();
    }
}
```

---

## ⚡ 빠른 기간 선택

### 1. 버튼 구성

```javascript
const quickRangeButtons = [
    { type: 'today', label: '오늘' },
    { type: 'thisWeek', label: '이번주' },
    { type: 'thisMonth', label: '이번달' },
    { type: 'fourWeeks', label: '4주' } // 4주 모드에서만 활성화
];
```

### 2. 기간 계산 로직

```javascript
function handleQuickRangeSelection(type) {
    const today = new Date();
    let startDate, endDate;
    
    switch (type) {
        case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
            
        case 'thisWeek':
            // 월요일부터 일요일까지
            const monday = getMondayOfWeek(today);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            startDate = monday;
            endDate = sunday;
            break;
            
        case 'thisMonth':
            // 1일부터 마지막일까지
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
            
        case 'fourWeeks':
            // 현재 화면에 표시된 4주 기간
            if (is4WeekMode) {
                startDate = get4WeekDisplayStartDate(get4WeekStartDate(currentDate));
                endDate = get4WeekDisplayEndDate(startDate);
            }
            break;
    }
    
    return { startDate, endDate };
}
```

### 3. 4주 버튼 활성화 조건

```javascript
// 4주 모드에서만 4주 버튼 활성화
const is4WeekMode = isAfterReferenceDate(currentDate);
const fourWeeksButton = document.querySelector('[data-type="fourWeeks"]');
if (fourWeeksButton) {
    fourWeeksButton.style.display = is4WeekMode ? 'block' : 'none';
}
```

---

## 📊 데이터 형식

### 1. 이중 형식 시스템

```javascript
// API 전송용 (YYYYMMDD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 화면 표시용 (YYYY-MM-DD)
function formatDateForDisplay(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

### 2. 사용 예시

```javascript
// API 호출 시
const apiData = {
    start: formatDate(startDate),        // "20250315"
    end: formatDate(endDate)            // "20250331"
};

// 화면 표시 시
const displayText = `${formatDateForDisplay(startDate)} ~ ${formatDateForDisplay(endDate)}`;
// "2025-03-15 ~ 2025-03-31"
```

---

## 🔄 이벤트 시스템

### 1. 콜백 함수 구조

```javascript
const callbacks = {
    onQuickSelect: (startDate, endDate, rangeType, details) => {
        // 빠른 선택 버튼 클릭 시
        console.log(`${rangeType} 선택:`, details.formattedStart, '~', details.formattedEnd);
    },
    
    onManualSelect: (date, inputType, details) => {
        // 개별 날짜 선택 시
        console.log(`${inputType} 날짜:`, details.formattedDate);
    },
    
    onRangeComplete: (startDate, endDate, details) => {
        // 기간 선택 완료 시
        console.log(`기간 완성: ${details.durationDays}일간`);
    },
    
    onValidationError: (errorType, message, details) => {
        // 유효성 검사 실패 시
        console.error(`오류: ${errorType} - ${message}`);
    }
};
```

### 2. 이벤트 상세 정보

```javascript
// onQuickSelect details
{
    formattedStart: "2025-03-15",
    formattedEnd: "2025-03-31",
    apiStart: "20250315",
    apiEnd: "20250331",
    durationDays: 17,
    rangeType: "thisMonth"
}

// onManualSelect details
{
    formattedDate: "2025-03-15",
    apiDate: "20250315",
    dayOfWeek: "토",
    isToday: false,
    isWeekend: true
}

// onRangeComplete details
{
    formattedStart: "2025-03-15",
    formattedEnd: "2025-03-31",
    apiStart: "20250315",
    apiEnd: "20250331",
    durationDays: 17,
    isWeekend: false
}
```

---

## ⚠️ 구현 시 고려사항

### 1. 날짜 계산 주의사항

**JavaScript Date 객체 특성:**
- 월은 0부터 시작 (0=1월, 11=12월)
- `setMonth()` 사용 시 자동으로 날짜 조정됨
- 예: 1월 31일에서 `setMonth(1)` → 2월 28일(또는 29일)로 자동 조정

**해결 방법:**
```javascript
// 안전한 월 이동
function safeSetMonth(date, month) {
    const originalDay = date.getDate();
    date.setMonth(month);
    
    // 날짜가 변경되었다면 마지막 날로 설정
    if (date.getDate() !== originalDay) {
        date.setDate(0); // 이전 달의 마지막 날
    }
}
```

### 2. 4주 달력 특수 처리

**첫 주 제외 로직:**
- 8월 25일~31일은 계산에 포함하지만 화면에 표시하지 않음
- 실제 4주는 9월 1일~28일만 표시
- 네비게이션 시에는 8월 25일부터 계산

### 3. 브라우저 호환성

**지원 브라우저:**
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

**폴리필 필요 사항:**
- `String.padStart()`: IE 지원 안됨
- `Array.includes()`: IE 지원 안됨

### 4. 성능 최적화

**렌더링 최적화:**
- DOM 조작 최소화
- 이벤트 위임 사용
- 불필요한 재계산 방지

**메모리 관리:**
- 이벤트 리스너 정리
- DOM 요소 참조 해제
- 컴포넌트 소멸 시 정리

### 5. 접근성 고려사항

**키보드 네비게이션:**
- Tab 키로 모든 요소 접근 가능
- Enter/Space 키로 선택
- 화살표 키로 날짜 이동

**스크린 리더 지원:**
- ARIA 속성 추가
- 의미있는 텍스트 제공
- 상태 변경 알림

---

## 📝 구현 체크리스트

### 필수 기능
- [ ] 2025-09-01 기준 4주 달력 전환
- [ ] 일반 달력 ↔ 4주 달력 네비게이션
- [ ] 빠른 기간 선택 (오늘, 이번주, 이번달, 4주)
- [ ] 단일 날짜 선택
- [ ] 기간 선택 (시작일/종료일)
- [ ] 이중 데이터 형식 (API용/표시용)
- [ ] 콜백 기반 이벤트 시스템

### 선택 기능
- [ ] 듀얼 달력 (범위 선택용)
- [ ] 년/월 직접 선택
- [ ] 유효성 검사
- [ ] 키보드 네비게이션
- [ ] 반응형 디자인
- [ ] 다국어 지원

### 테스트 항목
- [ ] 4주 달력 전환 정확성
- [ ] 날짜 계산 정확성
- [ ] 네비게이션 동작
- [ ] 빠른 선택 기능
- [ ] 콜백 함수 호출
- [ ] 브라우저 호환성
- [ ] 성능 테스트

---

이 가이드를 참고하여 각자의 언어와 프레임워크에 맞게 SmartCalendar를 재구현하시기 바랍니다. 