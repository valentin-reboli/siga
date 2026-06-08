import { apiClient } from './client';
import type { AsistenciaResumen, AsistenciaRoster, EstadoAsistencia } from '../types';

export interface RegistroAsistencia {
  inscripcionId: string;
  estado: EstadoAsistencia;
}

export const asistenciasApi = {
  /** Roster de la cursada; si se pasa `fecha`, trae el estado ya cargado ese día. */
  roster: (materiaId: string, cicloLectivo: number, fecha?: string) =>
    apiClient
      .get<AsistenciaRoster>(`/asistencias/materias/${materiaId}/roster`, {
        params: { cicloLectivo, fecha },
      })
      .then((r) => r.data),

  /** Guarda (upsert) la asistencia de una clase. */
  guardar: (
    materiaId: string,
    data: { fecha: string; cicloLectivo: number; registros: RegistroAsistencia[] },
  ) =>
    apiClient
      .post<{ guardados: number; fecha: string }>(`/asistencias/materias/${materiaId}`, data)
      .then((r) => r.data),

  /** Resumen por alumno (% de asistencia). */
  resumen: (materiaId: string, cicloLectivo: number) =>
    apiClient
      .get<AsistenciaResumen>(`/asistencias/materias/${materiaId}/resumen`, {
        params: { cicloLectivo },
      })
      .then((r) => r.data),

  /** Fechas (YYYY-MM-DD) en las que ya se tomó asistencia. */
  clases: (materiaId: string, cicloLectivo: number) =>
    apiClient
      .get<string[]>(`/asistencias/materias/${materiaId}/clases`, { params: { cicloLectivo } })
      .then((r) => r.data),
};
