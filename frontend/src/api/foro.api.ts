import { apiClient } from './client';
import type {
  Adjunto,
  Comentario,
  ForoFeed,
  Publicacion,
  PublicacionDetalle,
  TipoPublicacion,
} from '../types';

export interface NuevaPublicacion {
  tipo: TipoPublicacion;
  titulo: string;
  contenido: string;
  fijado?: boolean;
  archivos?: File[];
}

export const foroApi = {
  // Feed de una materia (incluye flag puedePublicar).
  feed: (
    materiaId: string,
    params: { tipo?: TipoPublicacion; q?: string; page?: number; pageSize?: number } = {},
  ) =>
    apiClient
      .get<ForoFeed>(`/foro/materias/${materiaId}/publicaciones`, { params })
      .then((r) => r.data),

  // Detalle de una publicación con comentarios.
  getPublicacion: (id: string) =>
    apiClient.get<PublicacionDetalle>(`/foro/publicaciones/${id}`).then((r) => r.data),

  // Crear publicación (con adjuntos opcionales) vía multipart/form-data.
  crearPublicacion: (materiaId: string, data: NuevaPublicacion) => {
    const fd = new FormData();
    fd.append('tipo', data.tipo);
    fd.append('titulo', data.titulo);
    fd.append('contenido', data.contenido);
    if (data.fijado) fd.append('fijado', 'true');
    (data.archivos ?? []).forEach((f) => fd.append('archivos', f));
    return apiClient
      .post<Publicacion>(`/foro/materias/${materiaId}/publicaciones`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  editarPublicacion: (
    id: string,
    data: Partial<Pick<Publicacion, 'titulo' | 'contenido' | 'tipo' | 'fijado'>>,
  ) => apiClient.patch<Publicacion>(`/foro/publicaciones/${id}`, data).then((r) => r.data),

  eliminarPublicacion: (id: string) =>
    apiClient.delete(`/foro/publicaciones/${id}`).then((r) => r.data),

  // Comentarios.
  comentar: (publicacionId: string, contenido: string) =>
    apiClient
      .post<Comentario>(`/foro/publicaciones/${publicacionId}/comentarios`, { contenido })
      .then((r) => r.data),

  eliminarComentario: (id: string) =>
    apiClient.delete(`/foro/comentarios/${id}`).then((r) => r.data),

  // Adjuntos sobre una publicación existente.
  subirAdjuntos: (publicacionId: string, archivos: File[]) => {
    const fd = new FormData();
    archivos.forEach((f) => fd.append('archivos', f));
    return apiClient
      .post<Adjunto[]>(`/foro/publicaciones/${publicacionId}/adjuntos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  eliminarAdjunto: (id: string) =>
    apiClient.delete(`/foro/adjuntos/${id}`).then((r) => r.data),

  // Descarga autenticada: trae el blob y dispara la descarga en el navegador.
  descargarAdjunto: async (id: string, nombre: string) => {
    const res = await apiClient.get(`/foro/adjuntos/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
