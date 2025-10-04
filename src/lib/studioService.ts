import { supabase } from './supabase';

export interface AdminEmailConfig {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isPrimary: boolean;
}

export interface StudioLocationConfig {
  includeInConfirmation: boolean;
  deliveryMethod: 'inline' | 'separate' | 'both';
  fullAddress: string;
  displayAddress: string;
  googleMapsLink: string;
  parkingInstructions: string;
  accessInstructions: string;
  separateEmailSubject: string;
  separateEmailDelay: number;
}

const DEFAULT_ADMIN_EMAIL_CONFIGS: AdminEmailConfig[] = [
  {
    id: '1',
    email: 'alerttradingvieww@gmail.com',
    name: 'Admin',
    isActive: true,
    isPrimary: true,
  },
];

const DEFAULT_LOCATION_CONFIG: StudioLocationConfig = {
  includeInConfirmation: true,
  deliveryMethod: 'inline',
  fullAddress: '',
  displayAddress: 'Private Studio, Nashville TN',
  googleMapsLink: '',
  parkingInstructions: 'Free parking available on-site',
  accessInstructions: 'Please ring doorbell upon arrival',
  separateEmailSubject: 'Studio Address & Directions - Your Appointment {{appointment_date}}',
  separateEmailDelay: 24,
};

const DEFAULT_STUDIO_INFO = {
  studio_name: 'Francis Lozano Studio',
  studio_phone: '(615) 555-NAIL',
  studio_email: 'hello@francislozanostudio.com',
  website_url: 'https://francislozanostudio.com',
};

export const createDefaultAdminEmailConfigs = (): AdminEmailConfig[] =>
  DEFAULT_ADMIN_EMAIL_CONFIGS.map((config, index) => ({
    ...config,
    id: config.id ?? `default-admin-${index + 1}`,
  }));

export const createDefaultLocationConfig = (): StudioLocationConfig => ({
  ...DEFAULT_LOCATION_CONFIG,
});

const sanitizeAdminEmailConfigs = (configs: AdminEmailConfig[]): AdminEmailConfig[] => {
  if (!Array.isArray(configs) || configs.length === 0) {
    return [];
  }

  let primaryAssigned = false;

  const normalized = configs
    .filter((config) => Boolean(config && config.email))
    .map((config, index) => {
      const candidate = {
        id: config.id || `admin-${Date.now()}-${index}`,
        email: config.email,
        name: config.name,
        isActive: typeof config.isActive === 'boolean' ? config.isActive : true,
        isPrimary: Boolean(config.isPrimary),
      } satisfies AdminEmailConfig;

      if (candidate.isPrimary && !primaryAssigned) {
        primaryAssigned = true;
        return candidate;
      }

      return {
        ...candidate,
        isPrimary: false,
      } satisfies AdminEmailConfig;
    });

  if (!primaryAssigned && normalized.length > 0) {
    normalized[0] = {
      ...normalized[0],
      isPrimary: true,
    };
  }

  return normalized;
};

const sanitizeLocationConfig = (config: StudioLocationConfig): StudioLocationConfig => {
  const base = createDefaultLocationConfig();

  return {
    includeInConfirmation: typeof config.includeInConfirmation === 'boolean' ? config.includeInConfirmation : base.includeInConfirmation,
    deliveryMethod: config.deliveryMethod === 'inline' || config.deliveryMethod === 'separate' || config.deliveryMethod === 'both'
      ? config.deliveryMethod
      : base.deliveryMethod,
    fullAddress: typeof config.fullAddress === 'string' ? config.fullAddress : base.fullAddress,
    displayAddress: typeof config.displayAddress === 'string' ? config.displayAddress : base.displayAddress,
    googleMapsLink: typeof config.googleMapsLink === 'string' ? config.googleMapsLink : base.googleMapsLink,
    parkingInstructions: typeof config.parkingInstructions === 'string' ? config.parkingInstructions : base.parkingInstructions,
    accessInstructions: typeof config.accessInstructions === 'string' ? config.accessInstructions : base.accessInstructions,
    separateEmailSubject: typeof config.separateEmailSubject === 'string' ? config.separateEmailSubject : base.separateEmailSubject,
    separateEmailDelay: Number.isFinite(config.separateEmailDelay) ? config.separateEmailDelay : base.separateEmailDelay,
  } satisfies StudioLocationConfig;
};

const mergeLocationWithDefaults = (config: StudioLocationConfig | null | undefined): StudioLocationConfig => {
  if (!config) {
    return createDefaultLocationConfig();
  }

  return sanitizeLocationConfig({
    ...createDefaultLocationConfig(),
    ...config,
  });
};

type StudioSettingsRow = {
  id: string;
  studio_name: string;
  studio_phone: string;
  studio_email: string;
  website_url: string;
  created_at: string;
  updated_at: string;
  admin_email_configs: AdminEmailConfig[] | null;
  location_config: StudioLocationConfig | null;
};

export interface StudioSettings {
  id: string;
  studio_name: string;
  studio_phone: string;
  studio_email: string;
  website_url: string;
  created_at: string;
  updated_at: string;
  admin_email_configs: AdminEmailConfig[];
  location_config: StudioLocationConfig;
}

export interface UpdateStudioSettingsInput {
  studio_name?: string;
  studio_phone?: string;
  studio_email?: string;
  website_url?: string;
  admin_email_configs?: AdminEmailConfig[];
  location_config?: StudioLocationConfig;
}

const mapStudioSettings = (record: StudioSettingsRow): StudioSettings => {
  const adminEmailsSource = Array.isArray(record.admin_email_configs)
    ? record.admin_email_configs
    : createDefaultAdminEmailConfigs();

  const sanitizedEmails = sanitizeAdminEmailConfigs(adminEmailsSource);

  return {
    id: record.id,
    studio_name: record.studio_name,
    studio_phone: record.studio_phone,
    studio_email: record.studio_email,
    website_url: record.website_url,
    created_at: record.created_at,
    updated_at: record.updated_at,
    admin_email_configs: sanitizedEmails,
    location_config: mergeLocationWithDefaults(record.location_config),
  } satisfies StudioSettings;
};

export const getStudioSettings = async (): Promise<StudioSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('studio_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching studio settings:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return mapStudioSettings(data[0]);
  } catch (error) {
    console.error('Error fetching studio settings:', error);
    return null;
  }
};

export const updateStudioSettings = async (updates: UpdateStudioSettingsInput): Promise<StudioSettings | null> => {
  try {
    const existingSettings = await getStudioSettings();
    const timestamp = new Date().toISOString();

    const updatePayload: Partial<StudioSettingsRow> = {
      updated_at: timestamp,
    };

    if (updates.studio_name !== undefined) {
      updatePayload.studio_name = updates.studio_name;
    }

    if (updates.studio_phone !== undefined) {
      updatePayload.studio_phone = updates.studio_phone;
    }

    if (updates.studio_email !== undefined) {
      updatePayload.studio_email = updates.studio_email;
    }

    if (updates.website_url !== undefined) {
      updatePayload.website_url = updates.website_url;
    }

    if (updates.admin_email_configs !== undefined) {
      updatePayload.admin_email_configs = sanitizeAdminEmailConfigs(updates.admin_email_configs);
    }

    if (updates.location_config !== undefined) {
      updatePayload.location_config = sanitizeLocationConfig(updates.location_config);
    }

    if (existingSettings) {
      const { data, error } = await supabase
        .from('studio_settings')
        .update(updatePayload)
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update studio settings: ${error.message}`);
      }

      return mapStudioSettings(data);
    }

    const insertPayload: Partial<StudioSettingsRow> = {
      studio_name: updates.studio_name ?? DEFAULT_STUDIO_INFO.studio_name,
      studio_phone: updates.studio_phone ?? DEFAULT_STUDIO_INFO.studio_phone,
      studio_email: updates.studio_email ?? DEFAULT_STUDIO_INFO.studio_email,
      website_url: updates.website_url ?? DEFAULT_STUDIO_INFO.website_url,
      admin_email_configs: sanitizeAdminEmailConfigs(
        updates.admin_email_configs ?? createDefaultAdminEmailConfigs(),
      ),
      location_config: sanitizeLocationConfig(
        updates.location_config ?? createDefaultLocationConfig(),
      ),
      updated_at: timestamp,
    };

    const { data, error } = await supabase
      .from('studio_settings')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create studio settings: ${error.message}`);
    }

    return mapStudioSettings(data);
  } catch (error) {
    console.error('Error updating studio settings:', error);
    throw error;
  }
};

export const ensureSingleStudioSettings = async (): Promise<StudioSettings | null> => {
  try {
      const { data, error } = await supabase
        .from('studio_settings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching all studio settings:', error);
      return null;
    }

    if (!data || data.length === 0) {
      const timestamp = new Date().toISOString();
      const { data: newData, error: insertError } = await supabase
        .from('studio_settings')
        .insert({
          ...DEFAULT_STUDIO_INFO,
          admin_email_configs: sanitizeAdminEmailConfigs(createDefaultAdminEmailConfigs()),
          location_config: sanitizeLocationConfig(createDefaultLocationConfig()),
          updated_at: timestamp,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default studio settings:', insertError);
        return null;
      }

      return newData ? mapStudioSettings(newData) : null;
    }

    let mostRecentRow = data[0];

    if (!Array.isArray(mostRecentRow.admin_email_configs) || mostRecentRow.location_config == null) {
      const timestamp = new Date().toISOString();

      const { data: normalizedRow, error: normalizeError } = await supabase
        .from('studio_settings')
        .update({
          admin_email_configs: sanitizeAdminEmailConfigs(
            Array.isArray(mostRecentRow.admin_email_configs) && mostRecentRow.admin_email_configs.length > 0
              ? mostRecentRow.admin_email_configs
              : createDefaultAdminEmailConfigs(),
          ),
          location_config: sanitizeLocationConfig(
            mostRecentRow.location_config ?? createDefaultLocationConfig(),
          ),
          updated_at: timestamp,
        })
        .eq('id', mostRecentRow.id)
        .select()
        .single();

      if (normalizeError) {
        console.error('Error normalizing studio settings:', normalizeError);
      } else if (normalizedRow) {
        mostRecentRow = normalizedRow;
      }
    }

    if (data.length > 1) {
      const idsToDelete = data.slice(1).map((item) => item.id);

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('studio_settings')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error('Error cleaning up duplicate studio settings:', deleteError);
        } else {
          console.log(`Cleaned up ${idsToDelete.length} duplicate studio settings records`);
        }
      }
    }

    return mapStudioSettings(mostRecentRow);
  } catch (error) {
    console.error('Error ensuring single studio settings:', error);
    return null;
  }
};

export const subscribeToStudioSettings = (callback: (settings: StudioSettings) => void) => {
  const subscription = supabase
    .channel('studio-settings-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'studio_settings' },
      async () => {
        const settings = await getStudioSettings();
        if (settings) {
          callback(settings);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('studioSettingsUpdated', { detail: settings }));
          }
        }
      },
    )
    .subscribe();

  return subscription;
};