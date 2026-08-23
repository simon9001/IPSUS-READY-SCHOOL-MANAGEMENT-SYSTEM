import { leaveRepository } from './leave.repository.js';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js';
function inclusiveDayCount(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 0)
        throw new ValidationError('endDate must be on or after startDate');
    return days;
}
export const leaveService = {
    listTypes: () => leaveRepository.findAllTypes(),
    createType: (input) => leaveRepository.createType(input),
    list: () => leaveRepository.findAll(),
    listByStaff: (staffId) => leaveRepository.findByStaff(staffId),
    async getById(id) {
        const request = await leaveRepository.findById(id);
        if (!request)
            throw new NotFoundError(`Leave request ${id} not found`);
        return request;
    },
    async balance(staffId, leaveTypeId, year) {
        const leaveType = await leaveRepository.findTypeById(leaveTypeId);
        if (!leaveType)
            throw new NotFoundError(`Leave type ${leaveTypeId} not found`);
        const daysTaken = await leaveRepository.approvedDaysTakenInYear(staffId, leaveTypeId, year);
        return { staffId, leaveTypeId, year, daysAllocated: leaveType.defaultDaysPerYear, daysTaken, daysRemaining: leaveType.defaultDaysPerYear - daysTaken };
    },
    async apply(input) {
        const daysRequested = inclusiveDayCount(input.startDate, input.endDate);
        return leaveRepository.create({
            staffId: input.staffId,
            leaveTypeId: input.leaveTypeId,
            startDate: input.startDate,
            endDate: input.endDate,
            daysRequested: String(daysRequested),
            reason: input.reason,
            recordedBy: input.recordedBy,
        });
    },
    async approve(id, approverId) {
        const request = await leaveRepository.findById(id);
        if (!request)
            throw new NotFoundError(`Leave request ${id} not found`);
        if (request.status !== 'pending')
            throw new ConflictError(`Leave request ${id} is ${request.status}, not pending`);
        const year = new Date(request.startDate).getFullYear();
        const bal = await this.balance(request.staffId, request.leaveTypeId, year);
        if (Number(request.daysRequested) > bal.daysRemaining) {
            throw new ValidationError(`Requested ${request.daysRequested} days exceeds remaining balance of ${bal.daysRemaining} days`);
        }
        return leaveRepository.decide(id, 'approved', approverId);
    },
    async reject(id, approverId) {
        const request = await leaveRepository.findById(id);
        if (!request)
            throw new NotFoundError(`Leave request ${id} not found`);
        if (request.status !== 'pending')
            throw new ConflictError(`Leave request ${id} is ${request.status}, not pending`);
        return leaveRepository.decide(id, 'rejected', approverId);
    },
};
