/**
 * Determine whether the given `date` is today.
 * @param {Date} date
 * @returns {Boolean}
 */
function isToday (date) {
    const now = new Date()

    return date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
}

/**
 * Determine whether the given `date` is tomorrow.
 * @param {Date} date
 * @returns {Boolean}
 */
function isTomorrow (date) {
    if (!(date instanceof Date)) {
        throw new Error('Invalid argument: you must provide a "date" instance')
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear()
}

/**
 * Determine whether the given `date` is after today.
 * @param {Date} date
 * @returns {Boolean}
 */
function isAfterToday (date) {
    const now = new Date()
    return date > now
}

/**
 * Determine whether the given `date` is after tomorrow.
 * @param {Date} date
 * @returns {Boolean}
 */
function isAfterTomorrow (date) {
    const now = new Date()
    return date > now && !isTomorrow(date)
}

/**
 * Combine the given `date and time` to check if the request is at least 24h in the future.
 * @param {Date} date
 * @param {string} time
 * @returns {Boolean}
 */
function check24h (date, time) {
    var formattedDate = ''
    if (date.toString().includes('/')) {
        const [yearIn, monthIn, dayIn] = date.split('/');
        formattedDate = `${yearIn}-${monthIn}-${dayIn}`;
    }
    else if (date.toString().includes('-')) {
        formattedDate = date
    }
    const [hours1, hours2, minutes1, minutes2] = time.split('');
    let dateString = formattedDate+"T"+hours1+hours2+":"+minutes1+minutes2+":00"
    const enteredDate = new Date(dateString);
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const date24hInFuture = enteredDate > tomorrow
    return date24hInFuture;
}

module.exports = {
    isToday,
    isTomorrow,
    isAfterToday,
    isAfterTomorrow,
    check24h
};
