'use client';

import { useState, useEffect } from 'react';
import { Camera, Emergencia, HeatmapPoint, CrimeType, Earthquake } from '@/types';
import { AlertTriangle, Video, Activity, X, ChevronDown, Filter, Flame, Zap } from 'lucide-react';

interface DashboardProps {
  cameras: Camera[];
  emergencias: Emergencia[];
  earthquakes: Earthquake[];
  showCameras: boolean;
  showEmergencies: boolean;
  showEarthquakes: boolean;
  showCriminalResidences: boolean;
  criminalResidencesData: HeatmapPoint[];
  crimeTypes: CrimeType[];
  onToggleCameras: () => void;
  onToggleEmergencies: () => void;
  onToggleEarthquakes: () => void;
  onToggleCriminalResidences: () => void;
  onEmergencyFilterChange?: (filter: Set<string> | undefined) => void;
  onCriminalResidencesFilterChange?: (filters: {
    crimeType?: string;
    deptCode?: string;
  }) => void;
}

export default function Dashboard({
  cameras,
  emergencias,
  earthquakes,
  showCameras,
  showEmergencies,
  showEarthquakes,
  showCriminalResidences,
  criminalResidencesData,
  crimeTypes,
  onToggleCameras,
  onToggleEmergencies,
  onToggleEarthquakes,
  onToggleCriminalResidences,
  onEmergencyFilterChange,
  onCriminalResidencesFilterChange,
}: DashboardProps) {
  // Estado para filtro de emergencias - todos seleccionados por defecto
  const tiposEmergencias = Array.from(
    new Set(emergencias.map((e) => e.tipoEmergencia))
  );
  
  // Ordenar por cantidad (mayor a menor)
  const tiposOrdenados = tiposEmergencias
    .map((tipo) => ({
      tipo,
      cantidad: emergencias.filter((e) => e.tipoEmergencia === tipo).length,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const [emergencyFilter, setEmergencyFilter] = useState<Set<string>>(
    new Set(tiposEmergencias) // Todos seleccionados por defecto
  );
  const [showEmergencyFilters, setShowEmergencyFilters] = useState(false);
  const [criminalResidencesFilter, setCriminalResidencesFilter] = useState<{
    crimeType?: string;
    deptCode?: string;
  }>({});
  const [showCriminalFilters, setShowCriminalFilters] = useState(false);

  // Estadísticas de cámaras
  const camarasOperativas = cameras.filter((c) => c.estado === 'Operativo').length;
  const camarasTrafico = cameras.filter((c) => c.tipo === 'Tráfico').length;

  // Estadísticas de emergencias
  const emergenciasRecientes = emergencias.filter((e) => {
    const fecha = new Date(e.fecha);
    const hace24Horas = new Date();
    hace24Horas.setHours(hace24Horas.getHours() - 24);
    return fecha >= hace24Horas;
  });

  const sismosRecientes = earthquakes.filter((q) => {
    const fecha = new Date(q.local_date || q.datetime_utc || q.utc_date || '');
    if (Number.isNaN(fecha.getTime())) return false;
    const hace24Horas = new Date();
    hace24Horas.setHours(hace24Horas.getHours() - 24);
    return fecha >= hace24Horas;
  });

  // Estadísticas por fuente
  const emergenciasBomberos = emergenciasRecientes.filter((e) => e.fuente === 'bomberos');
  const emergenciasINDECI = emergenciasRecientes.filter((e) => e.fuente === 'indeci');

  // Manejar cambio de filtro
  const handleFilterToggle = (tipo: string) => {
    const newFilter = new Set(emergencyFilter);
    if (newFilter.has(tipo)) {
      newFilter.delete(tipo);
    } else {
      newFilter.add(tipo);
    }
    setEmergencyFilter(newFilter);
    onEmergencyFilterChange?.(newFilter.size === tiposOrdenados.length ? undefined : newFilter);
  };

  // Desseleccionar todos
  const handleClearAll = () => {
    const newFilter = new Set<string>();
    setEmergencyFilter(newFilter);
    onEmergencyFilterChange?.(newFilter);
  };

  // Manejar cambio de filtros de residencias criminales
  const handleCriminalFiltersChange = (newFilters: { crimeType?: string; deptCode?: string }) => {
    setCriminalResidencesFilter(newFilters);
    onCriminalResidencesFilterChange?.(newFilters);
  };

  // Sincronizar el filtro inicial con el padre
  useEffect(() => {
    if (onEmergencyFilterChange && tiposEmergencias.length > 0 && emergencyFilter.size === tiposEmergencias.length) {
      onEmergencyFilterChange(undefined); // undefined = todos activos
    }
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control</h2>

      {/* Controles de visualización */}
      <div className="mb-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Mostrar en el Mapa
        </h3>
        <div className="flex flex-col space-y-2">
          {/* Cámaras */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showCameras}
              onChange={onToggleCameras}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700 flex items-center">
              <Video className="w-5 h-5 mr-2 text-blue-600" />
              Cámaras Públicas
            </span>
          </label>

          {/* Emergencias con filtro */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={showEmergencies}
                  onChange={onToggleEmergencies}
                  className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                />
                <span className="text-gray-700 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  Reportes de Emergencias
                </span>
              </label>
              
              {/* Botón de filtros */}
              <button
                onClick={() => setShowEmergencyFilters(!showEmergencyFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Filtrar tipos de emergencias"
              >
                <Filter className={`w-5 h-5 ${emergencyFilter.size === tiposOrdenados.length ? 'text-gray-400' : 'text-red-600'}`} />
              </button>
            </div>

            {/* Panel de filtros desplegable */}
            {showEmergencyFilters && (
              <div className="ml-8 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {emergencyFilter.size}/{tiposOrdenados.length} tipos activos
                  </span>
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Desseleccionar todo
                  </button>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {tiposOrdenados.map(({ tipo, cantidad }) => {
                    const isChecked = emergencyFilter.has(tipo);
                    return (
                      <label
                        key={tipo}
                        className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-white rounded transition-colors text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFilterToggle(tipo)}
                          className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <span className="flex-1 text-gray-700 text-xs">{tipo}</span>
                        <span className="text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                          {cantidad}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sismos */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showEarthquakes}
              onChange={onToggleEarthquakes}
              className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-gray-700 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-orange-600" />
              Sismos (IGP)
            </span>
          </label>

          {/* Última Residencia de Privados de Libertad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={showCriminalResidences}
                  onChange={onToggleCriminalResidences}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-gray-700 flex items-center">
                  <Flame className="w-5 h-5 mr-2 text-purple-600" />
                  Última Residencia de Privados de Libertad
                </span>
              </label>
              
              {/* Botón de filtros */}
              <button
                onClick={() => setShowCriminalFilters(!showCriminalFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Filtrar residencias"
                disabled={!showCriminalResidences}
              >
                <Filter className={`w-5 h-5 ${Object.keys(criminalResidencesFilter).length > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Panel de filtros de residencias */}
            {showCriminalFilters && showCriminalResidences && (
              <div className="ml-8 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    Filtros activos: {Object.keys(criminalResidencesFilter).length}
                  </span>
                  {Object.keys(criminalResidencesFilter).length > 0 && (
                    <button
                      onClick={() => {
                        setCriminalResidencesFilter({});
                        onCriminalResidencesFilterChange?.({});
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Filtro por tipo de crimen */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Tipo de Crimen
                    </label>
                    <select
                      value={criminalResidencesFilter.crimeType || ''}
                      onChange={(e) =>
                        handleCriminalFiltersChange({
                          ...criminalResidencesFilter,
                          crimeType: e.target.value || undefined,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Todos los tipos</option>
                      {crimeTypes.map((crime) => (
                        <option key={crime.crime_type} value={crime.crime_type}>
                          {crime.crime_type} ({crime.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por departamento */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Departamento
                    </label>
                    <select
                      value={criminalResidencesFilter.deptCode || ''}
                      onChange={(e) =>
                        handleCriminalFiltersChange({
                          ...criminalResidencesFilter,
                          deptCode: e.target.value || undefined,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Todos los departamentos</option>
                      <option value="15">Lima</option>
                      <option value="07">Callao</option>
                      <option value="05">Ayacucho</option>
                      <option value="25">Ucayali</option>
                      <option value="14">Lambayeque</option>
                      <option value="02">Ancash</option>
                      <option value="13">La Libertad</option>
                      <option value="10">Huanuco</option>
                      <option value="11">Ica</option>
                      <option value="20">Piura</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas de Cámaras */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Estadísticas de Cámaras
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total de Cámaras</p>
                <p className="text-2xl font-bold text-blue-700">{cameras.length}</p>
              </div>
              <Video className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Operativas</p>
                <p className="text-2xl font-bold text-green-700">{camarasOperativas}</p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">De Tráfico</p>
                <p className="text-2xl font-bold text-purple-700">{camarasTrafico}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Emergencias */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Estadísticas de Emergencias
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Total de Reportes</p>
                <p className="text-2xl font-bold text-red-700">{emergencias.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Últimas 24 horas</p>
                <p className="text-2xl font-bold text-orange-700">{emergenciasRecientes.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Bomberos (24h)</p>
                <p className="text-2xl font-bold text-yellow-700">{emergenciasBomberos.length}</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-sky-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sky-600 font-medium">INDECI (24h)</p>
                <p className="text-2xl font-bold text-sky-700">{emergenciasINDECI.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-sky-400" />
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Sismos (24h)</p>
                <p className="text-2xl font-bold text-orange-700">{sismosRecientes.length}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
