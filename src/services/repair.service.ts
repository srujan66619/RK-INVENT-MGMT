/* eslint-disable @typescript-eslint/no-explicit-any */
import { repairRepository } from "@/repositories/repair.repository";

export class RepairService {
  async getRepairs(filters?: { customerId?: string; technicianId?: string }) {
    return await repairRepository.getAll(filters);
  }

  async getRepairById(id: string) {
    return await repairRepository.getById(id);
  }

  async createRepair(data: any) {
    return await repairRepository.create(data);
  }

  async createRepairWithParts(data: any, parts: { item_id: string; quantity: number }[], technician_id: string) {
    return await repairRepository.createWithParts(data, parts, technician_id);
  }

  async updateRepair(id: string, data: any) {
    return await repairRepository.update(id, data);
  }

  async deleteRepair(id: string) {
    return await repairRepository.delete(id);
  }

  // --- Repair Notes ---
  async getRepairNotes(repairId: string) {
    return await repairRepository.getNotes(repairId);
  }

  async createRepairNote(data: any) {
    return await repairRepository.createNote(data);
  }

  async updateRepairNote(id: string, data: any) {
    return await repairRepository.updateNote(id, data);
  }

  // --- Appointments ---
  async getAppointmentEvents(repairId: string) {
    return await repairRepository.getAppointments(repairId);
  }

  async createAppointmentEvent(data: any) {
    return await repairRepository.createAppointment(data);
  }

  // --- WA Logs ---
  async getWaLogs(repairId: string) {
    return await repairRepository.getWaLogs(repairId);
  }
}

export const repairService = new RepairService();
