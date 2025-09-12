'use strict';
exports.main = async (event, context) => {
    console.log('event : ', event)

    return {
        code: 0,
        message: 'uniCloud is working!',
        timestamp: Date.now(),
        data: event
    }
};