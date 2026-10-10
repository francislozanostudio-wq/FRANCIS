import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Ban, 
  DollarSign, 
  Coffee,
  HelpCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getAvailabilityConfig,
  saveAvailabilityConfig,
  DEFAULT_AVAILABILITY_CONFIG,
  type AvailabilityConfig,
  type BlockedDate,
  type BlockedTimeSlot,
  formatTime24to12,
} from '@/lib/availabilityService';

const TIME_OPTIONS_24 = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00'
];

const DAYS_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AdminAvailability() {
  const [config, setConfig] = useState<AvailabilityConfig>(DEFAULT_AVAILABILITY_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // State for adding a blocked date
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedDateReason, setNewBlockedDateReason] = useState('');

  // State for adding a blocked time slot
  const [newTimeType, setNewTimeType] = useState<'specific_date' | 'recurring_day' | 'every_day'>('specific_date');
  const [newTimeDate, setNewTimeDate] = useState('');
  const [newTimeDayOfWeek, setNewTimeDayOfWeek] = useState<number>(1);
  const [newTimeSlot, setNewTimeSlot] = useState('10:00 AM');
  const [newTimeReason, setNewTimeReason] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getAvailabilityConfig();
      setConfig(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la configuración de horarios.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAvailabilityConfig(config);
      toast({
        title: 'Horarios Guardados',
        description: 'La configuración de disponibilidad y bloqueos se ha guardado correctamente.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle day open/closed
  const handleToggleDay = (dayOfWeek: number, isOpen: boolean) => {
    setConfig((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        return {
          ...d,
          isOpen,
          blocks: isOpen && d.blocks.length === 0
            ? [
                { start: '08:30', end: '13:30' },
                { start: '15:00', end: '19:00' },
              ]
            : d.blocks,
        };
      }),
    }));
  };

  // Update block time
  const handleUpdateBlock = (dayOfWeek: number, blockIdx: number, field: 'start' | 'end', val: string) => {
    setConfig((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const newBlocks = [...d.blocks];
        if (newBlocks[blockIdx]) {
          newBlocks[blockIdx] = { ...newBlocks[blockIdx], [field]: val };
        }
        return { ...d, blocks: newBlocks };
      }),
    }));
  };

  // Add blocked date
  const handleAddBlockedDate = () => {
    if (!newBlockedDate) {
      toast({ title: 'Atención', description: 'Selecciona una fecha para bloquear.', variant: 'destructive' });
      return;
    }
    const newEntry: BlockedDate = {
      id: 'bd-' + Date.now(),
      date: newBlockedDate,
      reason: newBlockedDateReason.trim() || 'No disponible',
    };
    setConfig((prev) => ({
      ...prev,
      blockedDates: [...prev.blockedDates, newEntry],
    }));
    setNewBlockedDate('');
    setNewBlockedDateReason('');
    toast({ title: 'Fecha bloqueada', description: `La fecha ${newEntry.date} fue agregada a la lista de bloqueos.` });
  };

  const handleRemoveBlockedDate = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((b) => b.id !== id),
    }));
  };

  // Add blocked time slot
  const handleAddBlockedTime = () => {
    if (newTimeType === 'specific_date' && !newTimeDate) {
      toast({ title: 'Atención', description: 'Ingresa la fecha para bloquear esa hora.', variant: 'destructive' });
      return;
    }

    const newEntry: BlockedTimeSlot = {
      id: 'bt-' + Date.now(),
      type: newTimeType,
      time: newTimeSlot,
      reason: newTimeReason.trim() || 'No disponible',
      ...(newTimeType === 'specific_date' ? { date: newTimeDate } : {}),
      ...(newTimeType === 'recurring_day' ? { dayOfWeek: Number(newTimeDayOfWeek) } : {}),
    };

    setConfig((prev) => ({
      ...prev,
      blockedTimeSlots: [...prev.blockedTimeSlots, newEntry],
    }));
    setNewTimeReason('');
    toast({ title: 'Horario bloqueado', description: `Se ha bloqueado ${newTimeSlot}. Recuerda guardar los cambios.` });
  };

  const handleRemoveBlockedTime = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      blockedTimeSlots: prev.blockedTimeSlots.filter((b) => b.id !== id),
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="text-accent h-6 w-6" />
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                Configuración de Horarios & Disponibilidad
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Personaliza el horario de atención, bloques de trabajo, fechas festivas y horas no disponibles.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-gold hover:bg-gradient-gold/90 text-luxury-black font-semibold shadow-gold"
          >
            {isSaving ? (
              <>
                <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                Guardando…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>

        {/* Studio rules reminder card */}
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="font-semibold text-accent uppercase tracking-wider text-xs flex items-center gap-1.5">
                <CheckCircle size={14} />
                Horario Oficial de Francis Lozano Studio
              </span>
              <p className="text-muted-foreground">
                <strong>Lunes a Sábado:</strong> Bloque 1: 8:30 AM – 1:30 PM · Pausa: 1:30 PM – 3:00 PM · Bloque 2: 3:00 PM – 7:00 PM · <strong>Domingos:</strong> Cerrado
              </p>
            </div>
            <Badge variant="outline" className="border-accent text-accent font-medium shrink-0">
              Depósito: ${config.depositAmount}
            </Badge>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">1. Horario Semanal</TabsTrigger>
            <TabsTrigger value="blocked-dates">
              2. Bloquear Fechas ({config.blockedDates.length})
            </TabsTrigger>
            <TabsTrigger value="blocked-times">
              3. Bloquear Horas ({config.blockedTimeSlots.length})
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: Horario Semanal ─── */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.weeklySchedule.map((day) => (
                <Card key={day.dayOfWeek} className={day.isOpen ? 'border-border' : 'border-border/50 opacity-70 bg-muted/20'}>
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-card-foreground">
                        {DAYS_NAMES_ES[day.dayOfWeek]}
                      </span>
                      {day.isOpen ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                          Abierto
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Cerrado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`day-toggle-${day.dayOfWeek}`} className="text-xs text-muted-foreground">
                        {day.isOpen ? 'Activo' : 'Inactivo'}
                      </Label>
                      <Switch
                        id={`day-toggle-${day.dayOfWeek}`}
                        checked={day.isOpen}
                        onCheckedChange={(checked) => handleToggleDay(day.dayOfWeek, checked)}
                      />
                    </div>
                  </CardHeader>

                  {day.isOpen && (
                    <CardContent className="px-4 pb-4 pt-1 space-y-3 text-xs sm:text-sm">
                      {/* Block 1 */}
                      {day.blocks[0] && (
                        <div className="p-2.5 rounded-lg bg-background/80 border border-border/60">
                          <span className="text-xs font-medium text-accent block mb-1.5">
                            Primer bloque (Mañana)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Inicio</Label>
                              <Select
                                value={day.blocks[0].start}
                                onValueChange={(val) => handleUpdateBlock(day.dayOfWeek, 0, 'start', val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS_24.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {formatTime24to12(t)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Fin (Inicio pausa)</Label>
                              <Select
                                value={day.blocks[0].end}
                                onValueChange={(val) => handleUpdateBlock(day.dayOfWeek, 0, 'end', val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS_24.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {formatTime24to12(t)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lunch Break Note */}
                      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-500/10 text-amber-600 rounded-md text-xs">
                        <Coffee size={13} className="shrink-0" />
                        <span>Pausa de almuerzo: 1:30 PM a 3:00 PM (no se admiten citas)</span>
                      </div>

                      {/* Block 2 */}
                      {day.blocks[1] && (
                        <div className="p-2.5 rounded-lg bg-background/80 border border-border/60">
                          <span className="text-xs font-medium text-accent block mb-1.5">
                            Segundo bloque (Tarde)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Inicio</Label>
                              <Select
                                value={day.blocks[1].start}
                                onValueChange={(val) => handleUpdateBlock(day.dayOfWeek, 1, 'start', val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS_24.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {formatTime24to12(t)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Cierre</Label>
                              <Select
                                value={day.blocks[1].end}
                                onValueChange={(val) => handleUpdateBlock(day.dayOfWeek, 1, 'end', val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS_24.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {formatTime24to12(t)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* General Parameters */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Parámetros Generales de Citas</CardTitle>
                <CardDescription>Ajusta el monto del depósito requerido para asegurar la cita.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-xs space-y-1.5">
                  <Label htmlFor="deposit-amount">Depósito de Reserva ($)</Label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="deposit-amount"
                      type="number"
                      value={config.depositAmount}
                      onChange={(e) => setConfig({ ...config, depositAmount: Number(e.target.value) || 0 })}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Por defecto: $20 requeridos para agendar.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 2: Bloquear Fechas ─── */}
          <TabsContent value="blocked-dates" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar size={18} className="text-accent" />
                  Agregar Fecha no Disponible
                </CardTitle>
                <CardDescription>
                  Bloquea un día completo en el calendario (festivos, días de descanso o vacaciones).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="block-date">Seleccionar Fecha</Label>
                    <Input
                      id="block-date"
                      type="date"
                      value={newBlockedDate}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="block-reason">Motivo (Opcional)</Label>
                    <Input
                      id="block-reason"
                      placeholder="Ej. Vacaciones, Día personal"
                      value={newBlockedDateReason}
                      onChange={(e) => setNewBlockedDateReason(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddBlockedDate} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Plus size={16} className="mr-1.5" />
                      Bloquear Fecha
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Fechas Actualmente Bloqueadas</CardTitle>
              </CardHeader>
              <CardContent>
                {config.blockedDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No hay fechas bloqueadas actualmente. Todos los días regulares de atención están disponibles.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {config.blockedDates.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-card-foreground">{item.date}</p>
                          <p className="text-xs text-muted-foreground">{item.reason || 'Sin motivo'}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBlockedDate(item.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 3: Bloquear Horas Específicas ─── */}
          <TabsContent value="blocked-times" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ban size={18} className="text-accent" />
                  Bloquear Hora o Turno Específico
                </CardTitle>
                <CardDescription>
                  Permite bloquear una hora puntual (ej. una fecha específica), un horario recurrente (ej. todos los martes a las 10:00 AM) o la misma hora todos los días.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo de Bloqueo</Label>
                    <Select
                      value={newTimeType}
                      onValueChange={(val: any) => setNewTimeType(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="specific_date">Fecha Específica</SelectItem>
                        <SelectItem value="recurring_day">Mismo día cada semana</SelectItem>
                        <SelectItem value="every_day">Todos los días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newTimeType === 'specific_date' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="time-date">Fecha</Label>
                      <Input
                        id="time-date"
                        type="date"
                        value={newTimeDate}
                        onChange={(e) => setNewTimeDate(e.target.value)}
                      />
                    </div>
                  )}

                  {newTimeType === 'recurring_day' && (
                    <div className="space-y-1.5">
                      <Label>Día de la Semana</Label>
                      <Select
                        value={String(newTimeDayOfWeek)}
                        onValueChange={(val) => setNewTimeDayOfWeek(Number(val))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_NAMES_ES.map((name, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              Todos los {name}s
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Hora a Bloquear</Label>
                    <Select value={newTimeSlot} onValueChange={setNewTimeSlot}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS_24.map((t) => (
                          <SelectItem key={t} value={formatTime24to12(t)}>
                            {formatTime24to12(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="time-reason">Motivo (Opcional)</Label>
                    <Input
                      id="time-reason"
                      placeholder="Ej. Cita personal"
                      value={newTimeReason}
                      onChange={(e) => setNewTimeReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleAddBlockedTime} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Plus size={16} className="mr-1.5" />
                    Bloquear este Horario
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Horarios Actualmente Bloqueados</CardTitle>
              </CardHeader>
              <CardContent>
                {config.blockedTimeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No hay horarios bloqueados de forma manual.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {config.blockedTimeSlots.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-card-foreground">
                              {item.time}
                            </span>
                            {item.type === 'specific_date' && (
                              <Badge variant="outline" className="text-xs">
                                Fecha: {item.date}
                              </Badge>
                            )}
                            {item.type === 'recurring_day' && (
                              <Badge variant="secondary" className="text-xs">
                                Todos los {DAYS_NAMES_ES[item.dayOfWeek ?? 1]}s
                              </Badge>
                            )}
                            {item.type === 'every_day' && (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                                Todos los días
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.reason || 'Sin motivo'}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBlockedTime(item.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
