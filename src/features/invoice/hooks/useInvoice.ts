import { useState, useCallback, useEffect } from "react";
import { invoiceService } from "../services/invoice.service";
import {
  PatientBillingData,
  BillingVisit,
  QueryPatientBillingParams,
} from "../types/invoice.types";
import { usePatient } from "@/features/patient/hooks/usePatient";
import { Patient } from "@/features/patient/types/patient.types";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { getErrorMessage } from "@/shared/utils/error.utils";

export function useInvoice() {
  const { patients, isLoading: patientsLoading, fetchPatients } = usePatient();
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [billingData, setBillingData] = useState<PatientBillingData | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UNPAID" | "PAID">("ALL");

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (patients.length > 0 && !activePatient) {
      setActivePatient(patients[0]);
    }
  }, [patients, activePatient]);

  const fetchBilling = useCallback(
    async (isRefresh = false) => {
      if (!activePatient?.patient_id) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params: QueryPatientBillingParams = {};
        if (activeFilter === "UNPAID") {
          params.payment_status = "UNPAID";
        } else if (activeFilter === "PAID") {
          params.payment_status = "SUCCESSED";
        }

        const res = await invoiceService.getPatientBilling(activePatient.patient_id, params);
        if (res?.data) {
          setBillingData(res.data);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải hóa đơn viện phí:", err);
        showGlobalToast(getErrorMessage(err, "Không thể tải dữ liệu viện phí"), "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activePatient?.patient_id, activeFilter]
  );

  useEffect(() => {
    if (activePatient?.patient_id) {
      fetchBilling();
    }
  }, [activePatient?.patient_id, activeFilter, fetchBilling]);

  return {
    patients,
    activePatient,
    setActivePatient,
    loading: loading || (patientsLoading && !activePatient),
    refreshing,
    billingData,
    activeFilter,
    setActiveFilter,
    refetch: fetchBilling,
  };
}

export function useVisitInvoice(patientId?: string, bookingId?: string) {
  const [loading, setLoading] = useState(false);
  const [visitDetail, setVisitDetail] = useState<BillingVisit | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!patientId || !bookingId) return;
    setLoading(true);
    try {
      const res = await invoiceService.getPatientVisitBilling(patientId, bookingId);
      if (res?.data?.visit) {
        setVisitDetail(res.data.visit);
      }
    } catch (err: any) {
      console.error("Lỗi tải chi tiết hóa đơn lần khám:", err);
      showGlobalToast(getErrorMessage(err, "Không thể tải chi tiết hóa đơn"), "error");
    } finally {
      setLoading(false);
    }
  }, [patientId, bookingId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    loading,
    visitDetail,
    refetch: fetchDetail,
  };
}
