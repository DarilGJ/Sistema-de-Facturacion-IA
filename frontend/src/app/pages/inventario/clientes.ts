import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import {
  Cliente,
  ClientePayload,
  MetodoCancelacion,
  PrecioFacturar,
  PlazoUnidad,
  TipoIdentificacion,
  TipoPersona,
} from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu } from '../../shared/row-menu/row-menu';

const LABELS_TIPO_ID: Record<TipoIdentificacion, string> = {
  nit: 'NIT',
  cui_dpi: 'CUI/DPI',
  consumidor_final: 'Consumidor Final',
  extranjero: 'Extranjero',
};

const LABELS_PERSONA: Record<TipoPersona, string> = {
  juridico: 'Jurídico',
  individual: 'Individual',
};

const LABELS_PRECIO: Record<PrecioFacturar, string> = {
  precio_1: 'Precio 1',
  precio_2: 'Precio 2',
  precio_3: 'Precio 3',
};

const PAISES = [
  {
    grupo: 'América',
    items: [
      'Guatemala',
      'Belice',
      'El Salvador',
      'Honduras',
      'Nicaragua',
      'Costa Rica',
      'Panamá',
      'México',
      'Estados Unidos',
      'Canadá',
      'Colombia',
      'Venezuela',
      'Ecuador',
      'Perú',
      'Bolivia',
      'Chile',
      'Argentina',
      'Brasil',
      'República Dominicana',
      'Cuba',
    ],
  },
  {
    grupo: 'Europa',
    items: ['España', 'Alemania', 'Francia', 'Italia', 'Reino Unido', 'Países Bajos', 'Bélgica', 'Suiza', 'Portugal'],
  },
];

const TELEFONO_EXTRANJERO = /^\+?[0-9\s-]{0,20}$/;

@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule, UiIcon, RowMenu],
  templateUrl: './clientes.html',
  styleUrl: './inventario-shared.css',
})
export class Clientes implements OnInit {
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly pageSize = signal(10);
  readonly filtrosOpen = signal(false);
  readonly filtroEstado = signal('activo');
  readonly filtroPersona = signal('');
  readonly filtroIdentificacion = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly accionesOpen = signal(false);
  readonly satMessage = signal('');
  readonly extrasOpen = signal(false);
  readonly configOpen = signal(false);
  readonly esJuridico = signal(false);
  readonly esCredito = signal(false);
  readonly esExtranjero = signal(false);
  readonly esConsumidorFinal = signal(false);
  readonly muestraSat = signal(true);
  readonly paises = PAISES;
  private silenciarTipoId = false;

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    const persona = this.filtroPersona();
    const identificacion = this.filtroIdentificacion();
    return this.inventario.clientes().filter((c) => {
      const matchQ =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.nombre_comercial || '').toLowerCase().includes(q) ||
        (c.codigo || '').toLowerCase().includes(q);
      const matchEstado = !estado || (estado === 'activo' ? !!c.estado : !c.estado);
      const matchPersona = !persona || (c.tipo_persona || 'individual') === persona;
      const matchId = !identificacion || (c.tipo_identificacion || 'nit') === identificacion;
      return matchQ && matchEstado && matchPersona && matchId;
    });
  });

  readonly visibles = computed(() => pageSlice(this.filtrados(), this.pagina(), this.pageSize()));
  readonly paginas = computed(() => pageNumbers(this.filtrados().length, this.pageSize()));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina(), this.pageSize()));
  readonly paginaActual = computed(() => clampPage(this.pagina(), this.filtrados().length, this.pageSize()));

  readonly form;

  constructor(
    readonly inventario: InventarioService,
    private readonly fb: FormBuilder
  ) {
    this.form = this.fb.group({
      tipo_identificacion: this.fb.nonNullable.control<TipoIdentificacion>('nit', Validators.required),
      tipo_persona: this.fb.nonNullable.control<TipoPersona>('individual', Validators.required),
      nit: ['', Validators.required],
      nombre: ['', Validators.required],
      razon_social: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      direccion: ['', Validators.required],
      pais: [''],
      nombre_comercial: [''],
      telefono2: [''],
      email2: ['', Validators.email],
      email3: ['', Validators.email],
      nota: [''],
      metodo_cancelacion: this.fb.nonNullable.control<MetodoCancelacion>('contado', Validators.required),
      plazo_unidad: this.fb.nonNullable.control<PlazoUnidad>('dias'),
      plazo: [0],
      precio_facturar: this.fb.nonNullable.control<PrecioFacturar>('precio_1', Validators.required),
      porcentaje_descuento: [0],
      codigo: [''],
      id_vendedor: ['' as string | number],
      zona: [''],
      credito_maximo: [0],
      estado: [true],
    });

    this.form.controls.tipo_identificacion.valueChanges.subscribe((tipo) => {
      if (this.silenciarTipoId) {
        return;
      }
      this.aplicarTipoIdentificacion(tipo);
    });

    this.form.controls.tipo_persona.valueChanges.subscribe((tipo) => {
      this.esJuridico.set(tipo === 'juridico');
      if (tipo !== 'juridico') {
        this.form.controls.razon_social.setValue('');
      }
    });

    this.form.controls.metodo_cancelacion.valueChanges.subscribe((metodo) => {
      this.esCredito.set(metodo === 'credito');
      if (metodo !== 'credito') {
        this.form.patchValue({ credito_maximo: 0, plazo: 0, plazo_unidad: 'dias' });
      }
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  @HostListener('document:click')
  closeAcciones(): void {
    this.accionesOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.formOpen() && !this.saving()) {
      this.cancelar();
    }
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.inventario.listarClientes().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar los clientes.'));
      },
    });
    this.inventario.listarVendedores().subscribe({
      error: () => this.inventario.vendedores.set([]),
    });
  }

  defaults() {
    return {
      tipo_identificacion: 'nit' as TipoIdentificacion,
      tipo_persona: 'individual' as TipoPersona,
      nit: '',
      nombre: '',
      razon_social: '',
      email: '',
      telefono: '',
      direccion: '',
      pais: '',
      nombre_comercial: '',
      telefono2: '',
      email2: '',
      email3: '',
      nota: '',
      metodo_cancelacion: 'contado' as MetodoCancelacion,
      plazo_unidad: 'dias' as PlazoUnidad,
      plazo: 0,
      precio_facturar: 'precio_1' as PrecioFacturar,
      porcentaje_descuento: 0,
      codigo: '',
      id_vendedor: '',
      zona: '',
      credito_maximo: 0,
      estado: true,
    };
  }

  abrirNuevo(): void {
    this.editingId.set(null);
    this.silenciarTipoId = true;
    this.form.reset(this.defaults());
    this.silenciarTipoId = false;
    this.errorMessage.set('');
    this.satMessage.set('');
    this.extrasOpen.set(false);
    this.configOpen.set(false);
    this.esJuridico.set(false);
    this.esCredito.set(false);
    this.aplicarTipoIdentificacion('nit');
    this.formOpen.set(true);
  }

  abrirEditar(item: Cliente): void {
    this.editingId.set(item.id);
    this.silenciarTipoId = true;
    this.form.reset({
      tipo_identificacion: item.tipo_identificacion || 'nit',
      tipo_persona: item.tipo_persona || 'individual',
      nit: item.nit,
      nombre: item.nombre,
      razon_social: item.razon_social ?? '',
      email: item.email ?? '',
      telefono: item.telefono ?? '',
      direccion: item.direccion ?? '',
      pais: item.pais ?? '',
      nombre_comercial: item.nombre_comercial ?? '',
      telefono2: item.telefono2 ?? '',
      email2: item.email2 ?? '',
      email3: item.email3 ?? '',
      nota: item.nota ?? '',
      metodo_cancelacion: item.metodo_cancelacion || 'contado',
      plazo_unidad: item.plazo_unidad || 'dias',
      plazo: Number(item.plazo || 0),
      precio_facturar: item.precio_facturar || 'precio_1',
      porcentaje_descuento: Number(item.porcentaje_descuento || 0),
      codigo: item.codigo ?? '',
      id_vendedor: item.id_vendedor ?? '',
      zona: item.zona ?? '',
      credito_maximo: Number(item.credito_maximo || 0),
      estado: !!item.estado,
    });
    this.silenciarTipoId = false;
    this.errorMessage.set('');
    this.satMessage.set('');
    this.extrasOpen.set(this.tieneExtras(item));
    this.configOpen.set(this.tieneConfig(item));
    this.esJuridico.set((item.tipo_persona || 'individual') === 'juridico');
    this.esCredito.set((item.metodo_cancelacion || 'contado') === 'credito');
    this.aplicarTipoIdentificacion(item.tipo_identificacion || 'nit', true);
    this.formOpen.set(true);
  }

  cancelar(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.satMessage.set('');
    this.extrasOpen.set(false);
    this.configOpen.set(false);
  }

  toggleExtras(): void {
    this.extrasOpen.update((open) => !open);
  }

  toggleConfig(): void {
    this.configOpen.update((open) => !open);
  }

  private aplicarTipoIdentificacion(tipo: TipoIdentificacion, preservar = false): void {
    this.esExtranjero.set(tipo === 'extranjero');
    this.esConsumidorFinal.set(tipo === 'consumidor_final');
    this.muestraSat.set(tipo === 'nit' || tipo === 'cui_dpi');

    const paisCtrl = this.form.controls.pais;
    const telefonoCtrl = this.form.controls.telefono;
    if (tipo === 'extranjero') {
      paisCtrl.setValidators(Validators.required);
      telefonoCtrl.setValidators(Validators.pattern(TELEFONO_EXTRANJERO));
    } else {
      paisCtrl.clearValidators();
      telefonoCtrl.clearValidators();
    }
    paisCtrl.updateValueAndValidity({ emitEvent: false });
    telefonoCtrl.updateValueAndValidity({ emitEvent: false });

    if (tipo === 'consumidor_final') {
      const direccion = String(this.form.controls.direccion.value || '').trim();
      const nombre = String(this.form.controls.nombre.value || '').trim();
      this.form.patchValue(
        {
          nit: 'CF',
          nombre: nombre || 'Consumidor Final',
          tipo_persona: 'individual',
          razon_social: '',
          pais: '',
          direccion: direccion || 'Guatemala',
        },
        { emitEvent: false }
      );
      this.esJuridico.set(false);
      this.form.controls.nit.disable({ emitEvent: false });
      this.form.controls.nombre.enable({ emitEvent: false });
      this.form.controls.tipo_persona.disable({ emitEvent: false });
      return;
    }

    this.form.controls.nit.enable({ emitEvent: false });
    this.form.controls.nombre.enable({ emitEvent: false });
    this.form.controls.tipo_persona.enable({ emitEvent: false });

    if (preservar) {
      if (tipo !== 'extranjero') {
        this.form.controls.pais.setValue('', { emitEvent: false });
      }
      return;
    }

    const nit = String(this.form.controls.nit.value || '');
    const nombre = String(this.form.controls.nombre.value || '');
    const patch: Record<string, string> = {};
    if (nit.toUpperCase() === 'CF') {
      patch['nit'] = '';
    }
    if (nombre.trim().toLowerCase() === 'consumidor final') {
      patch['nombre'] = '';
    }
    patch['pais'] = tipo === 'extranjero' ? String(this.form.controls.pais.value || '') || 'Guatemala' : '';
    this.form.patchValue(patch, { emitEvent: false });
  }

  private tieneExtras(item: Cliente): boolean {
    return !!(item.nombre_comercial || item.telefono2 || item.email2 || item.email3 || item.nota);
  }

  private tieneConfig(item: Cliente): boolean {
    return (
      item.metodo_cancelacion === 'credito' ||
      (item.precio_facturar && item.precio_facturar !== 'precio_1') ||
      Number(item.porcentaje_descuento || 0) > 0 ||
      !!item.codigo ||
      !!item.id_vendedor ||
      !!item.zona ||
      Number(item.credito_maximo || 0) > 0 ||
      Number(item.plazo || 0) > 0 ||
      item.estado === false
    );
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  requiredError(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.hasError('required') && (control.touched || control.dirty);
  }

  emailError(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.hasError('email') && !control.hasError('required') && (control.touched || control.dirty);
  }

  telefonoExtranjeroError(): boolean {
    const control = this.form.controls.telefono;
    return control.hasError('pattern') && (control.touched || control.dirty);
  }

  buscarSat(): void {
    const nit = String(this.form.controls.nit.value || '').trim();
    if (!nit) {
      this.form.controls.nit.markAsTouched();
      this.satMessage.set('Ingresa el número de identificación para consultar.');
      return;
    }

    this.satMessage.set('La consulta SAT se conectará más adelante. Revisa el número e ingresa el nombre.');
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa los campos requeridos.');
      return;
    }

    const value = this.form.getRawValue();
    const payload: ClientePayload = {
      tipo_identificacion: value.tipo_identificacion,
      tipo_persona: value.tipo_persona,
      nombre: String(value.nombre).trim(),
      nit: String(value.nit).trim(),
      razon_social: value.tipo_persona === 'juridico' ? value.razon_social?.trim() || null : null,
      email: value.email?.trim() || null,
      telefono: value.telefono?.trim() || null,
      direccion: value.direccion?.trim() || null,
      pais: value.tipo_identificacion === 'extranjero' ? value.pais?.trim() || null : null,
      nombre_comercial: value.nombre_comercial?.trim() || null,
      telefono2: value.telefono2?.trim() || null,
      email2: value.email2?.trim() || null,
      email3: value.email3?.trim() || null,
      nota: value.nota?.trim() || null,
      metodo_cancelacion: value.metodo_cancelacion,
      plazo_unidad: value.metodo_cancelacion === 'credito' ? value.plazo_unidad : 'dias',
      plazo: value.metodo_cancelacion === 'credito' ? Number(value.plazo || 0) : 0,
      precio_facturar: value.precio_facturar,
      porcentaje_descuento: Number(value.porcentaje_descuento || 0),
      codigo: value.codigo?.trim() || null,
      id_vendedor: value.id_vendedor === '' || value.id_vendedor === null ? null : Number(value.id_vendedor),
      zona: value.zona?.trim() || null,
      credito_maximo: value.metodo_cancelacion === 'credito' ? Number(value.credito_maximo || 0) : 0,
      estado: !!value.estado,
    };

    this.saving.set(true);
    this.errorMessage.set('');

    const request = this.editingId()
      ? this.inventario.actualizarCliente(this.editingId()!, payload)
      : this.inventario.crearCliente(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.editingId.set(null);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(apiErrorMessage(err));
      },
    });
  }

  desactivar(item: Cliente): void {
    if (!item.estado) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.inventario.desactivarCliente(item.id).subscribe({
      next: () => this.saving.set(false),
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(apiErrorMessage(err));
      },
    });
  }

  setBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }

  toggleFiltros(): void {
    this.filtrosOpen.update((open) => !open);
  }

  setFiltroEstado(value: string): void {
    this.filtroEstado.set(value);
    this.pagina.set(1);
  }

  setFiltroPersona(value: string): void {
    this.filtroPersona.set(value);
    this.pagina.set(1);
  }

  setFiltroIdentificacion(value: string): void {
    this.filtroIdentificacion.set(value);
    this.pagina.set(1);
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.pagina.set(1);
  }

  toggleAcciones(event: Event): void {
    event.stopPropagation();
    this.accionesOpen.update((open) => !open);
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  etiquetaTipoId(tipo?: TipoIdentificacion | null): string {
    return LABELS_TIPO_ID[tipo || 'nit'] || 'NIT';
  }

  etiquetaPersona(tipo?: TipoPersona | null): string {
    return LABELS_PERSONA[tipo || 'individual'] || 'Individual';
  }

  etiquetaPrecio(precio?: PrecioFacturar | null): string {
    return LABELS_PRECIO[precio || 'precio_1'] || 'Precio 1';
  }

  telefonos(item: Cliente): string {
    const uno = item.telefono || 'N/D';
    const dos = item.telefono2 || 'N/D';
    return `${uno} / ${dos}`;
  }
}
