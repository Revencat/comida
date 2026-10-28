// Tickets de ejemplo para probar el lector sin hacer ninguna foto.
export interface SampleTicket { id: string; label: string; text: string }

export const SAMPLE_TICKETS: SampleTicket[] = [
  {
    id: 'semana',
    label: 'Compra de la semana',
    text: [
      'MERCA-DONA VALENCIA',
      'Fecha 12/10/2026  Hora 18:42',
      'Tomate rama 1,20',
      'Leche semi 1L 1,05',
      'HUEVOS L 12 ud 2,15',
      'Pechuga de pollo 3,80',
      'Arroz redondo 1kg 1,45',
      'Brócoli 1,29',
      'Zanahoria 0,89',
      'Yogur natural 4 ud 1,60',
      'Pan de barra 0,70',
      'TOTAL 14,13 €',
      'IVA incluido. Gracias por su visita',
    ].join('\n'),
  },
  {
    id: 'verduras',
    label: 'Verdura y fruta',
    text: [
      'FRUTERIA EL HUERTO',
      'Platano 1,59',
      'Manzana golden 2,10',
      'Cebolla 0,95',
      'Patata 2kg 1,98',
      'Pimiento verde 1,35',
      'Limon 0,80',
      'TOTAL 8,77 €',
    ].join('\n'),
  },
];
