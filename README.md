# 📅 SmartCalendar - 스마트 기간선택 시스템

> 4주 단위 혼합 달력과 빠른기간선택을 지원하는 고급 날짜/기간 선택 컴포넌트

## 🚀 주요 특징

- **🔄 하이브리드 달력**: 2025.09.01을 기준으로 일반달력/4주달력 자동 전환
- **⚡ 빠른기간선택**: 팝업 내 [오늘/이번주/이번달/4주] 버튼 자동 추가
- **📅 년/월 직접 이동**: 달력 헤더 클릭으로 년도/월 선택기 팝업
- **🎯 4주 모드 자동 감지**: 4주 달력에서만 4주 버튼 활성화
- **🔗 고급 콜백 시스템**: onQuickSelect, onManualSelect, onRangeComplete, onValidationError
- **📊 이중 데이터 형식**: YYYYMMDD (API 연동) + YYYY-MM-DD (화면 표시)
- **✅ 완전 호환**: 기존 코드 수정 없이 동작

## 📁 파일 구조

```
SmartCalendar/
├── js/
│   ├── CalendarCore.js           # 핵심 달력 로직 & 공통 함수
│   └── DatePickerComponent.js    # 날짜/기간 선택 컴포넌트
├── css/
│   ├── common.css               # 통합 스타일시트
│   └── calendar.css             # 달력 전용 스타일
├── MiniCalendarComponent_01.html # 미니달력 기본 버전
├── MiniCalendarComponent_02.html # 미니달력 6주고정 버전
├── MiniCalendarComponent_03.html # 미니달력 월별 경계선 버전
├── MiniCalendarComponent_04.html # 미니달력 월별 그룹라인 버전
├── SmartCalendar.html           # 메인 달력 시스템
├── DatePickerDemo.html          # 스마트 기간선택 데모
└── README.md                    # 프로젝트 문서
```

## 🔧 핵심 컴포넌트

### 1. CalendarCore.js - 달력 핵심 로직

**주요 상수 및 함수:**
```javascript
// 핵심 상수
REFERENCE_DATE = new Date(2025, 8, 1)  // 2025-09-01 기준일
BASE_DATE = new Date(2025, 8, 1)       // 4주 모드 시작일
NEXT_BLOCK_DATE = new Date(2025, 8, 29) // 다음 4주 블록

// 주요 함수
isAfterReferenceDate(date)    // 기준일 이후 판정
get4WeekStartDate(date)       // 4주 달력 시작일 계산
moveToPreviousDate(date)      // 이전 기간 이동
moveToNextDate(date)          // 다음 기간 이동
formatDateRange(start, end)   // 날짜 범위 텍스트 생성
```

### 2. DatePickerComponent.js - 스마트 기간선택

**함수 오버로딩 지원:**
```javascript
// 단일 날짜 선택
openDatePicker('inputId')

// 기간 선택 (고급 콜백)
openDatePicker('startId', 'endId', 'start', {
    onQuickSelect: (start, end, type, details) => {},
    onManualSelect: (date, inputType, details) => {},
    onRangeComplete: (start, end, details) => {},
    onValidationError: (type, message, details) => {}
})
```

**빠른기간선택 버튼:**
- **오늘**: 당일 선택
- **이번주**: 월요일~일요일
- **이번달**: 1일~마지막일
- **4주**: 4주 모드에서만 활성화, 화면 표시 기간 그대로 적용

### 3. 미니달력 컴포넌트 (4가지 버전)

| 파일 | 특징 | 용도 |
|------|------|------|
| **01.html** | 기본 미니달력 | 단순한 날짜 표시 |
| **02.html** | 6주 고정 옵션 | 달력 크기 일정 유지 |
| **03.html** | 월별 경계선 | 월 구분 시각화 |
| **04.html** | 월별 그룹라인 | 고급 월 그룹 스타일링 |

## 💡 사용법

### 기본 설정

```html
<!-- 필수 파일 로드 -->
<link rel="stylesheet" href="css/common.css">
<script src="js/CalendarCore.js"></script>
<script src="js/DatePickerComponent.js"></script>
```

### 단일 날짜 선택

```javascript
// 방법 1: createSingleDatePicker 사용
const picker = createSingleDatePicker({
    onApply: (selectedDate) => {
        console.log('선택:', formatDate(selectedDate)); // YYYYMMDD
    }
});
picker.open(document.getElementById('dateInput'));

// 방법 2: 함수 오버로딩 사용
openDatePicker('dateInput');
```

### 기간 선택 (고급)

```javascript
openDatePicker('startDate', 'endDate', 'start', {
    // 팝업 내 빠른선택 버튼 클릭
    onQuickSelect: (startDate, endDate, rangeType, details) => {
        console.log(`${rangeType} 선택:`, details.formattedStart, '~', details.formattedEnd);
        if (rangeType === 'fourWeeks') {
            // 4주 기간 특별 처리
        }
    },
    
    // 개별 날짜 선택
    onManualSelect: (selectedDate, inputType, details) => {
        console.log(`${inputType} 날짜:`, details.formattedDate);
    },
    
    // 기간 선택 완료
    onRangeComplete: (startDate, endDate, details) => {
        console.log(`기간 완성: ${details.durationDays}일간`);
        // API 호출 예시
        fetchData({
            start: details.formattedStart.replace(/-/g, ''), // YYYYMMDD
            end: details.formattedEnd.replace(/-/g, '')     // YYYYMMDD
        });
    },
    
    // 유효성 검사 실패
    onValidationError: (errorType, message, details) => {
        if (errorType === 'startAfterEnd') {
            alert('시작일이 종료일보다 늦을 수 없습니다.');
        }
    }
});
```

## 🎯 특별 기능

### 4주 달력 시스템

**전환 기준:** 2025년 9월 1일
- **이전 (2025.08 이하)**: 일반 월별 달력
- **이후 (2025.09 이상)**: 4주 단위 달력

**4주 모드 특징:**
```
2025.09.01 ~ 2025.09.28  # 첫 번째 4주 블록
2025.09.29 ~ 2025.10.26  # 두 번째 4주 블록
2025.10.27 ~ 2025.11.23  # 세 번째 4주 블록
```

### 년/월 직접 이동

달력 헤더 텍스트 클릭 시 년도/월 선택기 팝업:
- **일반 모드**: "2025.06" 클릭 → 년도/월 선택
- **4주 모드**: "2025.09.01 ~ 2025.09.28" 클릭 → 년도/월 선택

### 데이터 형식 이중화

```javascript
// API 전송용 (YYYYMMDD)
const apiFormat = formatDate(date);        // "20250315"

// 화면 표시용 (YYYY-MM-DD) 
const displayFormat = formatDateForDisplay(date); // "2025-03-15"
```

## 📱 호환성

- **기존 코드**: 100% 호환 (수정 불필요)
- **브라우저**: 모던 브라우저 지원 (ES6+)
- **반응형**: 모바일/태블릿/데스크톱

## 🎨 커스터마이징

### CSS 클래스

```css
/* 주요 클래스 */
.mini-calendar-container      /* 달력 컨테이너 */
.mini-calendar-day.today      /* 오늘 날짜 */
.mini-calendar-day.selected   /* 선택된 날짜 */
.quick-range-btn             /* 빠른선택 버튼 */
.datepicker-overlay          /* 팝업 오버레이 */
```

### 스타일 확장

```css
/* 커스텀 테마 예시 */
.mini-calendar-day.selected {
    background: #your-color !important;
    color: #fff !important;
}

.quick-range-btn:hover {
    background: #your-hover-color;
}
```

## 🔍 데모 페이지

**DatePickerDemo.html**에서 모든 기능을 실제로 테스트할 수 있습니다:

1. **단일 날짜 선택**: 기본 날짜 피커 사용법
2. **스마트 기간선택**: 고급 콜백과 빠른선택 버튼
3. **실시간 콘솔**: 모든 이벤트와 콜백 로그 확인

## 🛠️ 개발 가이드

### 새로운 빠른선택 버튼 추가

```javascript
// handleQuickRangeSelection 함수에 케이스 추가
case 'customRange':
    startDate = new Date(/* 계산 로직 */);
    endDate = new Date(/* 계산 로직 */);
    break;
```

### 새로운 콜백 이벤트 추가

```javascript
// 글로벌 콜백 시스템 확장
window.datePickerCallbacks = {
    onCustomEvent: callbacks.onCustomEvent || null,
    // ... 기존 콜백들
};
```

### 4주 달력 기준일 변경

```javascript
// CalendarCore.js에서 상수 수정
const REFERENCE_DATE = new Date(2026, 0, 1); // 2026-01-01로 변경
```

## 📞 지원

- **데모**: DatePickerDemo.html 실행
- **콘솔 로그**: 모든 이벤트와 오류 추적 가능
- **디버깅**: 브라우저 개발자 도구 활용

---

**Made with ❤️ for Smart Date/Range Selection**
