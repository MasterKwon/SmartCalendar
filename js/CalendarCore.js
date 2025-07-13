/**
 * SmartCalendar 공통 핵심 로직
 * 2025년 9월 1일 기준으로 일반달력/4주달력 전환 로직
 */

// 공통 상수
const REFERENCE_DATE = new Date(2025, 8, 1); // 2025년 9월 1일
const BASE_DATE = new Date(2025, 8, 1); // 2025-09-01
const NEXT_BLOCK_DATE = new Date(2025, 8, 29); // 2025-09-29 (BASE_DATE + 28일)

// 요일 배열
const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MINI_WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * 기준일 이후인지 확인하는 함수
 * @param {Date} date - 확인할 날짜
 * @returns {boolean} 기준일 이후면 true
 */
function isAfterReferenceDate(date) {
    return date >= REFERENCE_DATE;
}

/**
 * 날짜가 9월 1일~28일 범위 내인지 확인
 * @param {Date} date - 확인할 날짜
 * @returns {boolean} 범위 내면 true
 */
function isInSeptemberBlock(date) {
    return date >= BASE_DATE && date < NEXT_BLOCK_DATE;
}

/**
 * 월요일로 보정하는 함수
 * @param {Date} date - 보정할 날짜
 * @returns {number} 월요일까지의 일수 차이
 */
function getDiffToMonday(date) {
    const day = date.getDay();
    return (day === 0 ? -6 : 1 - day);
}

/**
 * 월요일 날짜를 구하는 함수
 * @param {Date} date - 기준 날짜
 * @returns {Date} 해당 주의 월요일
 */
function getMondayOfWeek(date) {
    const monday = new Date(date);
    const diffToMonday = getDiffToMonday(date);
    monday.setDate(date.getDate() + diffToMonday);
    return monday;
}

/**
 * 4주 전 월요일을 구하는 함수
 * @param {Date} date - 기준 날짜
 * @returns {Date} 4주 전 월요일
 */
function getPrevious4WeekMonday(date) {
    const monday = getMondayOfWeek(date);
    monday.setDate(monday.getDate() - 28);
    return monday;
}

/**
 * 4주 후 월요일을 구하는 함수
 * @param {Date} date - 기준 날짜
 * @returns {Date} 4주 후 월요일
 */
function getNext4WeekMonday(date) {
    const monday = getMondayOfWeek(date);
    monday.setDate(monday.getDate() + 28);
    return monday;
}

/**
 * 이전 날짜로 이동하는 로직
 * @param {Date} currentDate - 현재 날짜
 * @returns {Date} 이동할 날짜
 */
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

/**
 * 다음 날짜로 이동하는 로직
 * @param {Date} currentDate - 현재 날짜
 * @returns {Date} 이동할 날짜
 */
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

/**
 * 4주 달력의 시작 날짜를 계산하는 함수
 * @param {Date} currentDate - 현재 날짜
 * @returns {Date} 4주 달력의 시작 날짜
 */
function get4WeekStartDate(currentDate) {
    if (isInSeptemberBlock(currentDate)) {
        // 9월 1일~28일 범위는 8월 25일(월)로 고정
        return new Date(2025, 7, 25);
    } else {
        // currentDate가 속한 주의 월요일에서 1주 전(7일 전)으로 startDate 설정
        const start = new Date(currentDate);
        const day = start.getDay();
        const diffToMonday = getDiffToMonday(start);
        start.setDate(start.getDate() + diffToMonday - 7);
        return new Date(start);
    }
}

/**
 * 4주 달력의 표시 시작 날짜를 계산하는 함수 (첫 주 제외)
 * @param {Date} startDate - 4주 달력의 시작 날짜
 * @returns {Date} 표시할 시작 날짜
 */
function get4WeekDisplayStartDate(startDate) {
    const displayStartDate = new Date(startDate);
    displayStartDate.setDate(startDate.getDate() + 7); // 첫 주 제외
    return displayStartDate;
}

/**
 * 4주 달력의 표시 종료 날짜를 계산하는 함수
 * @param {Date} displayStartDate - 표시 시작 날짜
 * @returns {Date} 표시할 종료 날짜
 */
function get4WeekDisplayEndDate(displayStartDate) {
    const displayEndDate = new Date(displayStartDate);
    displayEndDate.setDate(displayStartDate.getDate() + 27); // 4주
    return displayEndDate;
}

/**
 * 날짜 범위 텍스트를 생성하는 함수
 * @param {Date} startDate - 시작 날짜
 * @param {Date} endDate - 종료 날짜
 * @returns {string} 날짜 범위 텍스트
 */
function formatDateRange(startDate, endDate) {
    const startStr = `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${String(startDate.getDate()).padStart(2, '0')}`;
    const endStr = `${endDate.getFullYear()}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${String(endDate.getDate()).padStart(2, '0')}`;
    return `${startStr} ~ ${endStr}`;
}

/**
 * 월 표시 텍스트를 생성하는 함수
 * @param {Date} date - 날짜
 * @returns {string} 월 표시 텍스트
 */
function formatMonthDisplay(date) {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 월 표시 텍스트를 생성하는 함수 (한국어)
 * @param {Date} date - 날짜
 * @returns {string} 월 표시 텍스트
 */
function formatMonthDisplayKorean(date) {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월`;
}

/**
 * 주차 번호를 계산하는 함수
 * @param {Date} date - 날짜
 * @returns {number} 주차 번호
 */
function getWeekNumber(date) {
    // 해당 년도의 1월 1일
    const year = date.getFullYear();
    const firstDay = new Date(year, 0, 1);
    
    // 1월 1일부터 현재 날짜까지의 일수
    const daysDiff = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
    
    // 1월 1일의 요일 (일요일=0, 월요일=1)
    const firstDayOfWeek = firstDay.getDay();
    
    // 첫 번째 월요일까지의 날짜 계산
    const firstMondayOffset = firstDayOfWeek === 0 ? 1 : 8 - firstDayOfWeek;
    
    // 주차 계산
    if (daysDiff < firstMondayOffset) {
        return 1; // 첫 번째 주
    } else {
        return Math.floor((daysDiff - firstMondayOffset) / 7) + 2;
    }
}

// 전역 객체로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.CalendarCore = {
        REFERENCE_DATE,
        BASE_DATE,
        NEXT_BLOCK_DATE,
        WEEK_DAYS,
        MINI_WEEK_DAYS,
        isAfterReferenceDate,
        isInSeptemberBlock,
        getDiffToMonday,
        getMondayOfWeek,
        getPrevious4WeekMonday,
        getNext4WeekMonday,
        moveToPreviousDate,
        moveToNextDate,
        get4WeekStartDate,
        get4WeekDisplayStartDate,
        get4WeekDisplayEndDate,
        formatDateRange,
        formatMonthDisplay,
        formatMonthDisplayKorean,
        getWeekNumber
    };
}

// ES6 모듈로 내보내기 (Node.js 환경)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REFERENCE_DATE,
        BASE_DATE,
        NEXT_BLOCK_DATE,
        WEEK_DAYS,
        MINI_WEEK_DAYS,
        isAfterReferenceDate,
        isInSeptemberBlock,
        getDiffToMonday,
        getMondayOfWeek,
        getPrevious4WeekMonday,
        getNext4WeekMonday,
        moveToPreviousDate,
        moveToNextDate,
        get4WeekStartDate,
        get4WeekDisplayStartDate,
        get4WeekDisplayEndDate,
        formatDateRange,
        formatMonthDisplay,
        formatMonthDisplayKorean,
        getWeekNumber
    };
} 