// uniCloud-aliyun/cloudfunctions/jobManager/index.js
'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
    const {
        action,
        jobData,
        filters
    } = event

    switch (action) {
        case 'getJobs':
            return await getJobs(filters)
        case 'createJob':
            return await createJob(jobData)
        case 'applyJob':
            return await applyForJob(jobData, context.OPENID)
        case 'getMyApplications':
            return await getMyApplications(context.OPENID)
        default:
            return {
                code: -1, message: 'Invalid action'
            }
    }
}

async function getJobs(filters = {}) {
    try {
        const jobCollection = db.collection('jobs')
        let query = jobCollection.where({
            status: 'active'
        })

        // Add filters if provided
        if (filters.city) {
            query = query.where({
                city: filters.city
            })
        }
        if (filters.jobType) {
            query = query.where({
                jobType: filters.jobType
            })
        }

        const jobs = await query.orderBy('createdAt', 'desc').limit(20).get()

        return {
            code: 0,
            message: 'Jobs retrieved successfully',
            data: jobs.data
        }
    } catch (error) {
        return {
            code: -1,
            message: 'Failed to get jobs',
            error: error.message
        }
    }
}

async function createJob(jobData) {
    try {
        const jobCollection = db.collection('jobs')
        const newJob = await jobCollection.add({
            ...jobData,
            status: 'active',
            createdAt: Date.now(),
            applicants: 0
        })

        return {
            code: 0,
            message: 'Job created successfully',
            data: {
                _id: newJob.id
            }
        }
    } catch (error) {
        return {
            code: -1,
            message: 'Failed to create job',
            error: error.message
        }
    }
}

async function applyForJob(jobData, openid) {
    try {
        const applicationCollection = db.collection('applications')

        // Check if already applied
        const existing = await applicationCollection.where({
            jobId: jobData.jobId,
            applicantOpenid: openid
        }).get()

        if (existing.data.length > 0) {
            return {
                code: -1,
                message: 'Already applied for this job'
            }
        }

        // Create application
        await applicationCollection.add({
            jobId: jobData.jobId,
            applicantOpenid: openid,
            status: 'pending',
            appliedAt: Date.now(),
            message: jobData.message || ''
        })

        // Update job applicant count
        const jobCollection = db.collection('jobs')
        await jobCollection.doc(jobData.jobId).update({
            applicants: db.command.inc(1)
        })

        return {
            code: 0,
            message: 'Application submitted successfully'
        }
    } catch (error) {
        return {
            code: -1,
            message: 'Failed to apply for job',
            error: error.message
        }
    }
}

async function getMyApplications(openid) {
    try {
        const applicationCollection = db.collection('applications')
        const applications = await applicationCollection
            .where({
                applicantOpenid: openid
            })
            .orderBy('appliedAt', 'desc')
            .get()

        return {
            code: 0,
            message: 'Applications retrieved successfully',
            data: applications.data
        }
    } catch (error) {
        return {
            code: -1,
            message: 'Failed to get applications',
            error: error.message
        }
    }
}