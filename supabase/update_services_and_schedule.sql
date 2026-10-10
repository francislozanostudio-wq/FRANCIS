-- =====================================================================
-- FRANCIS LOZANO STUDIO - SERVICIOS, ADD-ONS Y CONFIGURACIÓN DE HORARIOS
-- =====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- Actualiza los servicios, add-ons y el horario oficial de atención.
-- =====================================================================

-- 1. Asegurar categorías de servicios requeridas
INSERT INTO service_categories (name, slug, display_order, is_active) VALUES
  ('Manicuras', 'manicures', 1, true),
  ('Sistemas de Uñas', 'systems', 2, true),
  ('Pedicuras', 'pedicures', 3, true),
  ('Cabello', 'hair', 4, true),
  ('Add-Ons & Retiro', 'add-ons', 5, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  is_active = true;

-- 2. Actualizar o insertar los Servicios Oficiales de Francis Lozano Studio
-- Limpiamos servicios anteriores para asegurar orden y exactitud o actualizamos
INSERT INTO services (name, description, price, duration, category, is_active, display_order)
VALUES
  (
    'Manicura rusa combinada + Builder Gel + esmaltado semipermanente',
    'Realizado sobre uña natural. Incluye preparación de la uña, manicura rusa/combinada, aplicación de Builder Gel y esmaltado semipermanente. (Precio inicial desde $70; no se realiza refill: se retira producto y se coloca nuevo).',
    70,
    120,
    'manicures',
    true,
    1
  ),
  (
    'Sistema Soft Gel',
    'Aplicación completa de sistema Soft Gel sobre uña. El precio inicial es desde $80, dependiendo de largo, diseño y complejidad. Duración aproximada 2 horas (3 horas si requiere retiro previo).',
    80,
    120,
    'systems',
    true,
    2
  ),
  (
    'Pedicura rusa combinada',
    'Servicio de pedicura detallada utilizando técnica rusa/combinada para pies limpios, suaves y esmaltado impecable. Duración aproximada: 2 horas.',
    60,
    120,
    'pedicures',
    true,
    3
  ),
  (
    'Pedi-Spa',
    'Experiencia completa y profunda de spa para pies con exfoliación, hidratación intensiva y cuidado ruso completo. Duración aproximada: 3 horas.',
    100,
    180,
    'pedicures',
    true,
    4
  ),
  (
    'Retiro de sistema',
    'Retiro cuidadoso de sistema anterior o producto artificial sin dañar la uña natural. Duración: 45 minutos.',
    20,
    45,
    'add-ons',
    true,
    5
  ),
  (
    'Keratina',
    'Tratamiento alisador y restaurador intensivo de keratina. Precio desde $150 (cabello hasta la línea del sostén ~3 horas; cabello más largo o abundante ~4 a 5 horas).',
    150,
    180,
    'hair',
    true,
    6
  ),
  (
    'Corte de puntas',
    'Corte y mantenimiento de puntas saludables para dar vida y forma a tu cabello. Duración: 30 minutos.',
    20,
    30,
    'hair',
    true,
    7
  )
ON CONFLICT DO NOTHING;

-- 3. Crear / Asegurar tabla add_ons y agregar Add-Ons oficiales
CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'add_ons' AND policyname = 'Anyone can view active add-ons'
  ) THEN
    CREATE POLICY "Anyone can view active add-ons" ON add_ons FOR SELECT USING (is_active = true);
  END IF;
END $$;

INSERT INTO add_ons (name, description, price, is_active, display_order)
VALUES
  (
    'Retiro de producto previo / Clienta recurrente',
    'Indispensable si tienes producto anterior que debe retirarse antes del nuevo set (+1 hora adicional en agenda).',
    20,
    true,
    1
  ),
  (
    'Nail Art / Diseños / Diseños 3D',
    'Diseño personalizado a mano alzada, 3D o pedrería (precio base; el total depende de la cantidad de uñas y complejidad).',
    15,
    true,
    2
  ),
  (
    'Efectos especiales (Chrome, Cat Eye, Aurora)',
    'Efecto espejo, ojo de gato, acabado perlado o aurora en esmalte semipermanente.',
    10,
    true,
    3
  ),
  (
    'Largo Extra (Soft Gel)',
    'Para set de Soft Gel largo o extra largo que requiere mayor tiempo de esculpido y nivelación.',
    10,
    true,
    4
  ),
  (
    'Cabello por debajo del sostén / Abundante (Keratina)',
    'Tiempo y producto adicional para melenas largas o con mucho volumen (+1 a 2 horas en agenda).',
    50,
    true,
    5
  )
ON CONFLICT DO NOTHING;

-- 4. Agregar columna availability_config a studio_settings si no existe
ALTER TABLE studio_settings 
ADD COLUMN IF NOT EXISTS availability_config jsonb;

-- 5. Configuración de Horario Oficial Francis Lozano Studio
-- Lunes a Sábado:
--   Bloque 1: 8:30 AM - 1:30 PM (08:30 - 13:30)
--   Pausa almuerzo: 1:30 PM - 3:00 PM (13:30 - 15:00)
--   Bloque 2: 3:00 PM - 7:00 PM (15:00 - 19:00)
-- Domingo: CERRADO
-- Depósito requerido: $20
UPDATE studio_settings
SET availability_config = '{
  "depositAmount": 20,
  "slotIntervalMinutes": 30,
  "lunchBreak": {
    "start": "13:30",
    "end": "15:00"
  },
  "weeklySchedule": [
    {
      "dayOfWeek": 0,
      "dayName": "Sunday",
      "isOpen": false,
      "blocks": []
    },
    {
      "dayOfWeek": 1,
      "dayName": "Monday",
      "isOpen": true,
      "blocks": [
        { "start": "08:30", "end": "13:30" },
        { "start": "15:00", "end": "19:00" }
      ]
    },
    {
      "dayOfWeek": 2,
      "dayName": "Tuesday",
      "isOpen": true,
      "blocks": [
        { "start": "08:30", "end": "13:30" },
        { "start": "15:00", "end": "19:00" }
      ]
    },
    {
      "dayOfWeek": 3,
      "dayName": "Wednesday",
      "isOpen": true,
      "blocks": [
        { "start": "08:30", "end": "13:30" },
        { "start": "15:00", "end": "19:00" }
      ]
    },
    {
      "dayOfWeek": 4,
      "dayName": "Thursday",
      "isOpen": true,
      "blocks": [
        { "start": "08:30", "end": "13:30" },
        { "start": "15:00", "end": "19:00" }
      ]
    },
    {
      "dayOfWeek": 5,
      "dayName": "Friday",
      "isOpen": true,
      "blocks": [
        { "start": "08:30", "end": "13:30" },
        { "start": "15:00", "end": "19:00" }
      ]
    },
    {
      "dayOfWeek": 6,
      "dayName": "Saturday",
      "isOpen": true,
      "blocks": [
        { "start": "08:30", "end": "13:30" },
        { "start": "15:00", "end": "19:00" }
      ]
    }
  ],
  "blockedDates": [],
  "blockedTimeSlots": []
}'::jsonb;

INSERT INTO studio_settings (studio_name, availability_config)
SELECT 'Francis Lozano Studio', '{
  "depositAmount": 20,
  "slotIntervalMinutes": 30,
  "lunchBreak": {
    "start": "13:30",
    "end": "15:00"
  },
  "weeklySchedule": [
    { "dayOfWeek": 0, "dayName": "Sunday", "isOpen": false, "blocks": [] },
    { "dayOfWeek": 1, "dayName": "Monday", "isOpen": true, "blocks": [{ "start": "08:30", "end": "13:30" }, { "start": "15:00", "end": "19:00" }] },
    { "dayOfWeek": 2, "dayName": "Tuesday", "isOpen": true, "blocks": [{ "start": "08:30", "end": "13:30" }, { "start": "15:00", "end": "19:00" }] },
    { "dayOfWeek": 3, "dayName": "Wednesday", "isOpen": true, "blocks": [{ "start": "08:30", "end": "13:30" }, { "start": "15:00", "end": "19:00" }] },
    { "dayOfWeek": 4, "dayName": "Thursday", "isOpen": true, "blocks": [{ "start": "08:30", "end": "13:30" }, { "start": "15:00", "end": "19:00" }] },
    { "dayOfWeek": 5, "dayName": "Friday", "isOpen": true, "blocks": [{ "start": "08:30", "end": "13:30" }, { "start": "15:00", "end": "19:00" }] },
    { "dayOfWeek": 6, "dayName": "Saturday", "isOpen": true, "blocks": [{ "start": "08:30", "end": "13:30" }, { "start": "15:00", "end": "19:00" }] }
  ],
  "blockedDates": [],
  "blockedTimeSlots": []
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM studio_settings);
