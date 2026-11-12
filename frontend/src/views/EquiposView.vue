<template>
  <div class="equipos-view">
    <div class="row q-col-gutter-lg">
      <!-- Columna Izquierda: Lista de Clubes -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
          <q-card-section class="q-py-md bg-slate-50 border-b">
            <div>
              <div class="text-subtitle1 text-weight-bold text-dark">Clubes del Torneo</div>
              <div class="text-caption text-grey-6">{{ clubesVisibles.length }} equipos registrados</div>
            </div>
          </q-card-section>

          <q-list separator class="club-list">
            <q-item
              v-for="e in clubesVisibles"
              :key="e.id || e._id"
              clickable
              :active="(e.id || e._id) === seleccionId"
              active-class="active-club-item"
              class="q-py-md"
              @click="seleccionId = (e.id || e._id)"
            >
              <q-item-section avatar>
                <div class="club-list-badge-box" :style="{ backgroundColor: e.escudocolor || e.color || '#059669' }">
                  <img
                    v-if="e.escudoUrl"
                    :src="e.escudoUrl"
                    alt="Escudo"
                    class="club-list-badge-img"
                  />
                  <span v-else-if="e.escudoFigura" class="club-list-badge-emoji">{{ e.escudoFigura }}</span>
                  <span v-else class="club-list-badge-dot" />
                </div>
              </q-item-section>

              <q-item-section>
                <div class="row items-center justify-between no-wrap">
                  <div class="row items-center no-wrap ellipsis">
                    <q-item-label class="text-weight-bold text-dark ellipsis">{{ e.nombre }}</q-item-label>
                    <q-badge
                      v-if="e.estadoAprobacion === 'Pendiente'"
                      color="amber-9"
                      text-color="white"
                      class="q-ml-xs text-weight-bolder font-10"
                    >
                      Pendiente Autorización
                    </q-badge>
                    <q-badge
                      v-if="store.esJugador && (e.id === store.miEquipoId || e._id === store.miEquipoId)"
                      color="indigo-7"
                      text-color="white"
                      size="xs"
                      class="q-ml-xs text-weight-bold"
                    >
                      Tu Club
                    </q-badge>
                  </div>
                  <q-badge
                    :color="store.equipoHabilitadoParaJugar(e.id || e._id) ? 'positive' : 'grey-7'"
                    text-color="white"
                    size="xs"
                    class="q-ml-xs text-weight-bold"
                  >
                    {{ store.cantidadJugadoresEquipo(e.id || e._id) }}/11 jug.
                  </q-badge>
                </div>
                <q-item-label caption class="text-grey-6">
                  {{ e.barriada || e.barrio || 'Sede Barrial' }} · DT: {{ e.capitan || e.tecnico || 'Sin asignar' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon :name="matChevronRight" color="grey-5" size="18px" />
              </q-item-section>
            </q-item>

            <q-item v-if="!store.equipos.length" class="q-py-xl text-center">
              <q-item-section class="text-grey-6">
                <q-icon :name="matGroups" size="36px" color="grey-4" class="q-mx-auto q-mb-xs" />
                <div class="text-body2 text-weight-medium">Sin equipos registrados</div>
                <div class="text-caption q-mt-xs">Los clubes son creados automáticamente por cada entrenador al registrarse.</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Columna Derecha: Detalle del Club y Plantel Oficial -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
          <template v-if="equipo">
            <!-- Banner Cabecera del Club -->
            <div class="club-header-banner q-pa-lg text-white" :style="{ background: headerGradient }">
              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-md">
                  <div
                    class="escudo-view-box flex flex-center rounded-borders shadow-2"
                    :style="{ background: equipo.escudocolor || '#059669' }"
                  >
                    <img v-if="equipo.escudoUrl" :src="equipo.escudoUrl" class="escudo-view-img" />
                    <span v-else class="escudo-view-emoji">{{ equipo.escudoFigura || '🛡️' }}</span>
                  </div>
                  <div>
                    <div class="text-caption text-uppercase text-weight-bold opacity-80">Ficha de Club</div>
                    <h2 class="text-h5 text-weight-bolder q-my-none text-white">{{ equipo.nombre }}</h2>
                    <div class="row items-center q-gutter-sm text-caption opacity-90 q-mt-xs">
                      <span v-if="equipo.barriada || equipo.barrio">
                        <q-icon :name="matPlace" size="14px" /> {{ equipo.barriada || equipo.barrio }}
                      </span>
                      <span>
                        <q-icon :name="matBadge" size="14px" /> Ⓒ Capitán: <strong>{{ equipo.capitan || 'Sin asignar' }}</strong>
                      </span>
                    </div>

                    <!-- Estado Reglamentario: Mínimo 11 personas y Capitán Oficial -->
                    <div class="q-mt-xs row items-center q-gutter-xs">
                      <span
                        v-if="plantel.length >= 11"
                        class="bg-emerald-800 text-emerald-100 text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center"
                      >
                        <q-icon name="check_circle" size="14px" class="q-mr-xs text-positive" />
                        Nómina con {{ plantel.length }} jugadores
                      </span>
                      <span
                        v-else
                        class="bg-amber-9 text-white text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center"
                      >
                        <q-icon name="warning" size="14px" class="q-mr-xs text-white" />
                        {{ plantel.length }}/11 jugadores (Mínimo 11)
                      </span>

                      <!-- Badge de Capitán -->
                      <span
                        v-if="store.tieneCapitan(equipo.id)"
                        class="bg-amber-8 text-white text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center font-11"
                      >
                        Ⓒ Capitán Oficial: {{ equipo.capitan }}
                      </span>
                      <span
                        v-else
                        class="bg-rose-9 text-white text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center font-11"
                      >
                        ⚠️ Sin Capitán Designado
                      </span>
                    </div>
                  </div>
                </div>

                <div class="row items-center q-gutter-sm">

                  <!-- Botón de Autorización del Club para el Organizador -->
                  <template v-if="store.esOrganizador && equipo.estadoAprobacion === 'Pendiente'">
                    <q-btn
                      unelevated
                      no-caps
                      color="amber-4"
                      text-color="dark"
                      :icon="matCheckCircle"
                      label="Autorizar Club Oficialmente"
                      class="text-weight-bolder shadow-2 animate-pulse-gentle"
                      :loading="autorizandoClub"
                      @click="autorizarClubActual(equipo.id)"
                    >
                      <q-tooltip>Autorizar la afiliación de este club para que pueda competir en el torneo e ingresar el DT</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      no-caps
                      color="white"
                      class="bg-white/20 text-weight-bold"
                      :icon="matClose"
                      label="Cancelar / Rechazar"
                      :loading="rechazandoClub"
                      @click="rechazarClubActual(equipo.id)"
                    >
                      <q-tooltip>Rechazar la solicitud de creación de este club</q-tooltip>
                    </q-btn>
                  </template>
                  <q-badge
                    v-else-if="equipo.estadoAprobacion === 'Pendiente'"
                    color="amber-9"
                    text-color="white"
                    class="text-weight-bold q-px-sm q-py-xs font-11 shadow-1"
                  >
                    ⏳ Club Pendiente de Autorización del Organizador
                  </q-badge>

                  <q-btn
                    v-if="store.esEntrenador && store.miEquipoId === equipo.id"
                    outline
                    no-caps
                    color="white"
                    :icon="matSports"
                    label="Elegir Posiciones (Pizarra DT)"
                    class="text-weight-bold"
                    @click="irAPizarraDT(equipo.id)"
                  />
                  <q-badge v-if="esMiClub" color="positive" text-color="white" class="text-weight-bold q-px-sm q-py-xs">
                    ⭐ Tu Club Afiliado
                  </q-badge>
                  <q-badge v-else color="slate-7" text-color="white" class="text-weight-bold q-px-sm q-py-xs">
                    Club Participante
                  </q-badge>
                </div>
              </div>
            </div>

            <!-- TARJETA DESTACADA PARA EL JUGADOR: TU FICHA Y SELECCIÓN DE DORSAL -->
            <div
              v-if="store.esJugador && esMiClub && miFichaJugador"
              class="q-pa-md bg-indigo-50 border-b border-indigo-2"
            >
              <div class="row items-center justify-between q-col-gutter-sm">
                <div class="row items-center q-gutter-md">
                  <div class="player-jersey-box flex flex-center shadow-2">
                    <span class="jersey-number font-mono">#{{ miFichaJugador.numero ?? miFichaJugador.dorsal ?? '—' }}</span>
                  </div>
                  <div>
                    <div class="text-caption text-weight-bolder text-indigo-9 text-uppercase">
                      ⚽ Tu Ficha de Jugador Oficial en {{ equipo?.nombre }}
                    </div>
                    <div class="text-subtitle1 text-weight-bolder text-dark row items-center q-gutter-xs">
                      <span>{{ [miFichaJugador.nombre, miFichaJugador.apellido].filter(Boolean).join(' ') }}</span>
                      <q-badge v-if="miFichaJugador.esCapitan || equipo?.capitan === miFichaJugador.nombre" color="amber-9" text-color="white" class="text-weight-bold font-10">
                        Ⓒ CAPITÁN
                      </q-badge>
                    </div>
                    <div class="text-caption text-grey-8 font-mono">
                      Posición: <strong>{{ miFichaJugador.posicion || 'Delantero' }}</strong> · Dorsal oficial: <strong>#{{ miFichaJugador.numero ?? miFichaJugador.dorsal ?? '—' }}</strong>
                    </div>
                  </div>
                </div>

                <div class="row items-center q-gutter-xs">
                  <!-- Original:
                  <q-btn unelevated color="indigo-7" text-color="white" no-caps :icon="matNumbers" label="Cambiar Dorsal" class="text-weight-bold shadow-1" @click="abrirDialogoCambioDorsal(miFichaJugador)" />
                  <q-btn unelevated color="amber-9" text-color="white" no-caps :icon="matSwapHoriz" label="🔄 Cambiar de Equipo" class="text-weight-bold shadow-2" @click="abrirDialogoTraspaso">
                    <q-tooltip>Solicita transferirte a otro club con la aprobación previa de tu DT y del DT de destino</q-tooltip>
                  </q-btn>
                  -->
                  <AppActionButton
                    unelevated
                    tone="indigo"
                    text-color="white"
                    no-caps
                    :icon="matNumbers"
                    label="Cambiar Dorsal"
                    class="text-weight-bold shadow-1"
                    @click="abrirDialogoCambioDorsal(miFichaJugador)"
                  />
                  <AppActionButton
                    unelevated
                    tone="warning"
                    text-color="white"
                    no-caps
                    :icon="matSwapHoriz"
                    label="🔄 Cambiar de Equipo"
                    class="text-weight-bold shadow-2"
                    @click="abrirDialogoTraspaso"
                  >
                    <q-tooltip>Solicita transferirte a otro club con la aprobación previa de tu DT y del DT de destino</q-tooltip>
                  </AppActionButton>
                </div>
              </div>
            </div>

            <!-- Tabla de Plantel -->
            <div class="q-pa-md">
              <div class="row items-center justify-between q-mb-sm">
                <div>
                  <div class="text-subtitle2 text-weight-bold text-dark row items-center q-gutter-xs">
                    <span>Plantel Oficial del Club</span>
                    <q-badge v-if="esMiClub" color="indigo-7" text-color="white" class="font-10 text-weight-bold">
                      ⭐ Tu Club
                    </q-badge>
                  </div>
                  <div v-if="!store.esJugador" class="text-caption text-grey-7 font-mono">
                    {{ plantel.length }} en nómina ·
                    <span :class="store.cantidadEnCancha(equipoSeleccionado?.id) > 11 ? 'text-negative text-weight-bolder' : 'text-emerald-8 text-weight-bold'">
                      {{ store.cantidadEnCancha(equipoSeleccionado?.id) }}/11 en cancha
                    </span>
                    <span v-if="store.cantidadEnCancha(equipoSeleccionado?.id) > 11" class="text-negative text-weight-bolder q-ml-xs">
                      ⚠️ (Excedido en +{{ store.cantidadEnCancha(equipoSeleccionado?.id) - 11 }})
                    </span>
                    · {{ store.cantidadEnBanca(equipoSeleccionado?.id) }} en banca
                  </div>
                  <div v-else class="text-caption text-grey-7 font-mono">
                    {{ plantel.length }} futbolistas inscritos · Plantel público oficial
                  </div>
                </div>
                <q-btn
                  v-if="!store.esJugador && store.cantidadEnCancha(equipoSeleccionado?.id) > 11"
                  unelevated
                  dense
                  size="sm"
                  color="negative"
                  no-caps
                  label="Enviar excedentes a banca"
                  @click="store.enviarExcedentesABanca(equipoSeleccionado?.id)"
                />
              </div>

              <div class="table-responsive">
                <table class="roster-table">
                  <thead>
                    <tr>
                      <th class="th-dorsal text-center">Dorsal</th>
                      <th class="th-name text-left">Jugador</th>
                      <th class="th-pos text-center">Posición / Rol</th>
                      <th class="th-goles text-center">Goles</th>
                      <th class="th-cards text-center">Tarjetas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="j in plantel"
                      :key="j.id"
                      class="roster-row"
                      :class="{ 'bg-indigo-50 border-l-4 border-indigo-7': esElMismoJugador(j) }"
                    >
                      <td class="text-center font-mono text-weight-bold text-primary">
                        <div class="row items-center justify-center q-gutter-xs">
                          <span class="dorsal-tag">#{{ j.dorsal ?? j.numero ?? '—' }}</span>
                          <span v-if="j.expulsadoDelTorneo" class="text-negative text-weight-bolder font-10" title="Expulsado del equipo y torneo por 3 rojas">
                            🚫 EXPULSADO
                          </span>
                          <span v-else-if="j.partidosSuspendidosRestantes > 0" class="text-amber-10 text-weight-bolder font-10 bg-amber-100 q-px-xs rounded" :title="j.motivoSancion">
                            🛑 Suspendido ({{ j.partidosSuspendidosRestantes }} PJ)
                          </span>
                          <span v-else-if="j.tarjetasRojasAcumuladas > 0" class="text-negative font-10 font-bold">
                            🟥 x{{ j.tarjetasRojasAcumuladas }}
                          </span>
                          <q-btn
                            v-if="store.esJugador && esElMismoJugador(j)"
                            flat
                            round
                            dense
                            size="xs"
                            color="indigo-7"
                            :icon="matEdit"
                            @click="abrirDialogoCambioDorsal(j)"
                          >
                            <q-tooltip>Cambiar tu número de camiseta</q-tooltip>
                          </q-btn>
                        </div>
                      </td>
                      <td class="text-weight-bold text-dark">
                        <div class="row items-center no-wrap q-gutter-xs">
                          <span>{{ [j.nombre, j.apellido].filter(Boolean).join(' ') }}</span>
                          <q-badge
                            v-if="esElMismoJugador(j)"
                            color="indigo-7"
                            text-color="white"
                            class="text-weight-bolder font-10 q-px-xs"
                          >
                            TÚ
                          </q-badge>
                          <q-badge
                            v-if="j.esCapitan || equipo?.capitan === j.nombre"
                            color="amber-9"
                            text-color="white"
                            class="text-weight-bolder font-10 q-px-xs"
                            title="Capitán Oficial del Club"
                          >
                            Ⓒ CAPITÁN
                          </q-badge>
                        </div>
                      </td>
                      <td class="text-center">
                        <span
                          class="pos-badge"
                          :class="store.normalizarPosicion(j.posicion) === 'banca' ? 'pos-badge-banca' : 'pos-badge-cancha'"
                        >
                          {{ store.normalizarPosicion(j.posicion) === 'banca' ? '🪑 En Banca' : (j.posicion || 'Delantero') }}
                        </span>
                      </td>
                      <td class="text-center font-mono text-weight-bold">
                        {{ j.goles ?? 0 }}
                      </td>
                      <td class="text-center">
                        <span class="card-pill bg-amber-500 text-white q-mr-xs">{{ j.amarillas ?? 0 }}</span>
                        <span class="card-pill bg-rose-600 text-white">{{ j.rojas ?? 0 }}</span>
                      </td>
                    </tr>

                    <tr v-if="!plantel.length">
                      <td colspan="5" class="text-center q-py-lg text-grey-6">
                        <div class="q-py-md">
                          <q-icon :name="matPersonOutline" size="32px" color="grey-4" class="q-mb-xs" />
                          <div class="text-body2 text-weight-medium">Aún no hay jugadores registrados en este club.</div>
                          <div class="text-caption text-grey-6 q-mt-xs">
                            Los futbolistas se incorporan al registrarse con rol jugador (con su clave de acceso) o mediante la nómina completada por el organizador.
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <q-card-section v-else class="q-pa-xl text-center text-grey-6">
            <q-icon :name="matTouchApp" size="40px" color="grey-4" class="q-mb-sm" />
            <div class="text-subtitle1 text-weight-medium">Selecciona un club para ver su nómina oficial</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Modales -->
    <EquipoDialog v-model="modalEquipo" />

    <!-- DIÁLOGO OFICIAL: ESCOGER / CAMBIAR DORSAL SIN REPETICIONES -->
    <q-dialog v-model="mostrarModalDorsal" persistent>
      <q-card style="min-width: 440px; max-width: 95vw;" class="rounded-borders bg-white shadow-10 overflow-hidden">
        <div class="bg-indigo-9 text-white q-pa-md row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <q-avatar size="36px" color="indigo-7" text-color="white" class="text-weight-bold">
              👕
            </q-avatar>
            <div>
              <div class="text-subtitle1 text-weight-bold">Escoger Número de Camiseta (Dorsal)</div>
              <div class="text-caption text-indigo-2">{{ equipo?.nombre }} · Ficha Oficial de Futbolista</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </div>

        <q-card-section class="q-pa-md">
          <div class="text-body2 text-grey-8 q-mb-md">
            Hola <strong>{{ [jugadorEditandoDorsal?.nombre, jugadorEditandoDorsal?.apellido].filter(Boolean).join(' ') }}</strong>, elige tu número oficial de camiseta reglamentario (del <strong>1 al 99</strong>).
            <div class="text-caption text-indigo-9 text-weight-bold q-mt-xs bg-indigo-50 q-pa-xs rounded-borders border border-indigo-2">
              ⚠️ Regla Oficial de la Liga: Cada dorsal es exclusivo y <strong>no puede repetirse</strong> con otro jugador de tu equipo.
            </div>
          </div>

          <!-- Dorsal actual y nuevo selector -->
          <div class="row items-center justify-around bg-slate-50 q-pa-md rounded-borders border q-mb-md">
            <div class="text-center">
              <div class="text-caption text-grey-7 font-bold">DORSAL ACTUAL</div>
              <div class="text-h4 font-mono text-weight-bolder text-grey-6">
                #{{ jugadorEditandoDorsal?.numero ?? jugadorEditandoDorsal?.dorsal ?? '—' }}
              </div>
            </div>

            <q-icon :name="matChevronRight" size="28px" color="grey-5" />

            <div class="text-center">
              <div class="text-caption text-indigo-9 font-bold">NUEVO DORSAL</div>
              <div
                class="text-h4 font-mono text-weight-bolder"
                :class="errorDorsalRepetido ? 'text-negative' : 'text-positive'"
              >
                #{{ inputDorsal || '?' }}
              </div>
            </div>
          </div>

          <!-- Input numérico -->
          <div class="q-mb-md">
            <div class="text-caption text-weight-bold text-dark q-mb-xs">Número deseado (1-99):</div>
            <q-input
              v-model.number="inputDorsal"
              type="number"
              outlined
              dense
              bg-color="white"
              min="1"
              max="99"
              placeholder="Ej: 7, 9, 10, 14, 23..."
              :error="!!errorDorsalRepetido"
              :error-message="errorDorsalRepetido"
              @update:model-value="validarDorsalEnVivo"
            >
              <template #prepend>
                <q-icon :name="matNumbers" color="indigo-7" />
              </template>
            </q-input>
          </div>

          <!-- Alerta de disponibilidad en vivo -->
          <div v-if="inputDorsal && !errorDorsalRepetido" class="q-mb-md">
            <q-banner dense rounded class="bg-positive text-white q-py-xs q-px-sm text-caption">
              ✅ ¡El dorsal #{{ inputDorsal }} está libre y disponible para tu camiseta!
            </q-banner>
          </div>

          <!-- Números disponibles sugeridos para clic directo -->
          <div class="q-mb-md">
            <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
              ⚡ Números libres disponibles (haz clic para asignar):
            </div>
            <div class="row q-gutter-xs items-center">
              <q-btn
                v-for="num in dorsalesDisponiblesSugeridos"
                :key="num"
                dense
                unelevated
                size="sm"
                no-caps
                :color="inputDorsal === num ? 'positive' : 'grey-3'"
                :text-color="inputDorsal === num ? 'white' : 'dark'"
                :label="`#${num}`"
                class="text-weight-bold font-mono q-px-sm"
                @click="seleccionarDorsalRapido(num)"
              />
            </div>
          </div>

          <!-- Dorsales ya ocupados por compañeros -->
          <div class="bg-rose-50 q-pa-sm rounded-borders border border-rose-2">
            <div class="text-caption text-weight-bold text-negative q-mb-xs">
              ⛔ Números ya ocupados en tu equipo (no disponibles):
            </div>
            <div class="row q-gutter-xs items-center">
              <q-badge
                v-for="d in dorsalesOcupadosEquipo"
                :key="d.numero"
                color="rose-2"
                text-color="rose-10"
                class="text-weight-medium font-mono font-11"
              >
                #{{ d.numero }} ({{ d.nombre }})
              </q-badge>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md bg-slate-50">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup no-caps />
          <q-btn
            unelevated
            color="indigo-8"
            label="Guardar Mi Dorsal"
            icon="check"
            no-caps
            class="text-weight-bold shadow-1"
            :loading="guardandoDorsal"
            :disable="!inputDorsal || !!errorDorsalRepetido"
            @click="ejecutarCambioDorsal"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>

    <!-- DIÁLOGO OFICIAL: SOLICITAR CAMBIO DE EQUIPO (TRASPASO) -->
    <q-dialog v-model="mostrarModalTraspaso">
      <q-card style="width: 500px; max-width: 95vw;" class="rounded-borders overflow-hidden bg-white shadow-10">
        <q-card-section class="bg-amber-9 text-white row items-center justify-between q-py-md">
          <div class="row items-center q-gutter-sm">
            <q-avatar size="36px" color="amber-1" text-color="amber-10">
              <q-icon :name="matSwapHoriz" size="24px" />
            </q-avatar>
            <div>
              <div class="text-subtitle1 text-weight-bolder">Solicitar Cambio de Equipo</div>
              <div class="text-caption font-11 text-amber-1">
                Fichaje reglamentario con doble aprobación de entrenadores
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" text-color="white" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md q-gutter-y-md">
          <div class="bg-amber-50 border border-amber-3 rounded-borders q-pa-sm text-caption text-slate-800">
            <strong>📋 Reglamento de Traspasos:</strong>
            <ol class="q-my-xs q-pl-md font-11">
              <li>Tu <strong>Entrenador actual ({{ miClubActualNombre }})</strong> recibirá una solicitud para otorgar tu carta de salida.</li>
              <li>Una vez liberado, el <strong>Entrenador del nuevo club</strong> deberá aceptar tu incorporación al plantel.</li>
            </ol>
          </div>

          <div>
            <div class="text-caption text-weight-bold text-slate-800 q-mb-xs">
              Club al que deseas transferirte *
            </div>
            <q-select
              v-model="equipoDestinoSeleccionado"
              :options="opcionesClubesDestino"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
              placeholder="Selecciona el nuevo club"
            >
              <template #prepend>
                <q-icon :name="matShield" color="amber-9" />
              </template>
            </q-select>
          </div>

          <div>
            <div class="text-caption text-weight-bold text-slate-800 q-mb-xs">
              Motivo del traspaso (Opcional)
            </div>
            <q-input
              v-model="motivoTraspaso"
              outlined
              dense
              type="textarea"
              rows="2"
              bg-color="white"
              placeholder="Ej: Búsqueda de minutos, acuerdo deportivo, cercanía..."
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="amber-10"
            text-color="white"
            label="Enviar Solicitud al Entrenador"
            :loading="enviandoTraspaso"
            :disable="!equipoDestinoSeleccionado"
            class="text-weight-bold q-px-md"
            @click="enviarSolicitudTraspaso"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTorneo, ROLES } from '../store/torneo.js'
import AppActionButton from '../components/AppActionButton.vue'
import EquipoDialog from '../components/EquipoDialog.vue'
import {
  matAdd,
  matPersonAdd,
  matChevronRight,
  matGroups,
  matPersonOutline,
  matTouchApp,
  matPlace,
  matBadge,
  matSports,
  matShield,
  matNumbers,
  matEdit,
  matCheckCircle,
  matClose,
  matSwapHoriz
} from '@quasar/extras/material-icons'

const $q = useQuasar()
const autorizandoClub = ref(false)

const rechazandoClub = ref(false)

const mostrarModalTraspaso = ref(false)
const equipoDestinoSeleccionado = ref(null)
const motivoTraspaso = ref('')
const enviandoTraspaso = ref(false)

const miClubActualNombre = computed(() => {
  return store.miEquipo?.nombre || 'tu club actual'
})

const opcionesClubesDestino = computed(() => {
  const miEqId = String(store.miEquipoId || '').trim()
  return (store.equipos || [])
    .filter(e => String(e.id || e._id).trim() !== miEqId && e.estadoAprobacion !== 'Rechazado')
    .map(e => ({
      label: e.nombre,
      value: e.id || e._id
    }))
})

function abrirDialogoTraspaso() {
  equipoDestinoSeleccionado.value = null
  motivoTraspaso.value = ''
  mostrarModalTraspaso.value = true
}

async function enviarSolicitudTraspaso() {
  if (!equipoDestinoSeleccionado.value) return
  if (!miFichaJugador.value) {
    $q.notify({ type: 'negative', message: 'No se encontró tu ficha de jugador activa' })
    return
  }
  enviandoTraspaso.value = true
  try {
    const jId = miFichaJugador.value.id || miFichaJugador.value._id
    const res = await store.solicitarTraspaso({
      jugadorId: jId,
      nuevoEquipoId: equipoDestinoSeleccionado.value,
      motivo: motivoTraspaso.value
    })
    mostrarModalTraspaso.value = false
    $q.notify({
      type: 'positive',
      icon: 'send',
      message: res.msg || 'Solicitud de traspaso enviada con éxito a tu entrenador actual.',
      position: 'top',
      timeout: 5000
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al solicitar el traspaso',
      position: 'top'
    })
  } finally {
    enviandoTraspaso.value = false
  }
}

async function autorizarClubActual(eqId) {
  if (!eqId) return
  autorizandoClub.value = true
  try {
    const res = await store.autorizarEquipo(eqId)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: res?.msg || '¡Club autorizado exitosamente!',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al autorizar el club',
      position: 'top'
    })
  } finally {
    autorizandoClub.value = false
  }
}

async function rechazarClubActual(eqId) {
  if (!eqId) return
  rechazandoClub.value = true
  try {
    const res = await store.rechazarEquipo(eqId)
    $q.notify({
      type: 'warning',
      icon: 'cancel',
      message: res?.msg || 'Solicitud de creación del club cancelada/rechazada.',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al cancelar club',
      position: 'top'
    })
  } finally {
    rechazandoClub.value = false
  }
}
const store = useTorneo()
const roleStore = store
const router = useRouter()

const seleccionId = ref(store.miEquipoId || null)
const modalEquipo = ref(false)
const completandoPlantel = ref(false)

// Estado para Diálogo de Selección de Dorsal (Exclusivo por club)
const mostrarModalDorsal = ref(false)
const jugadorEditandoDorsal = ref(null)
const inputDorsal = ref(null)
const errorDorsalRepetido = ref('')
const guardandoDorsal = ref(false)

const esMiClub = computed(() => {
  if (!equipo.value) return false
  const miId = String(store.miEquipoId || '').trim()
  const eqId = String(equipo.value.id || equipo.value._id || '').trim()
  return miId && eqId && miId === eqId
})

const miFichaJugador = computed(() => store.miJugador)

function esElMismoJugador(j) {
  if (!j) return false
  if (miFichaJugador.value) {
    const miJId = String(miFichaJugador.value.id || miFichaJugador.value._id || '').trim()
    const jId = String(j.id || j._id || '').trim()
    if (miJId && jId && miJId === jId) return true
  }
  if (store.user) {
    const uClean = String(store.user.usuario || '').toLowerCase().trim()
    const uNom = String(store.user.nombre || '').toLowerCase().trim()
    const jNom = String(j.nombre || '').toLowerCase().trim()
    const jApe = String(j.apellido || '').toLowerCase().trim()
    const jFull = `${jNom} ${jApe}`.trim()
    if (jNom === uClean || jFull === uNom || jNom === uNom) return true
    if (j.email && j.email.toLowerCase().includes(uClean)) return true
  }
  return false
}

// Dorsales ocupados por compañeros del equipo
const dorsalesOcupadosEquipo = computed(() => {
  if (!todosLosJugadoresDelClub.value || !todosLosJugadoresDelClub.value.length) return []
  const jActualId = String(jugadorEditandoDorsal.value?.id || jugadorEditandoDorsal.value?._id || '').trim()
  return todosLosJugadoresDelClub.value
    .filter(j => String(j.id || j._id || '').trim() !== jActualId)
    .map(j => ({
      numero: Number(j.numero ?? j.dorsal),
      nombre: [j.nombre, j.apellido && j.apellido !== '-' ? j.apellido : ''].filter(Boolean).join(' ')
    }))
    .filter(d => !isNaN(d.numero) && d.numero > 0)
    .sort((a, b) => a.numero - b.numero)
})

// Números libres sugeridos (del 1 al 99 no tomados en el equipo)
const dorsalesDisponiblesSugeridos = computed(() => {
  const ocupadosSet = new Set(dorsalesOcupadosEquipo.value.map(d => d.numero))
  const disponibles = []
  for (let n = 1; n <= 99; n++) {
    if (!ocupadosSet.has(n)) {
      disponibles.push(n)
      if (disponibles.length >= 16) break // Primeros 16 libres
    }
  }
  return disponibles
})

function abrirDialogoCambioDorsal(j) {
  jugadorEditandoDorsal.value = j || miFichaJugador.value
  inputDorsal.value = Number(jugadorEditandoDorsal.value?.numero ?? jugadorEditandoDorsal.value?.dorsal ?? '') || null
  errorDorsalRepetido.value = ''
  mostrarModalDorsal.value = true
}

function validarDorsalEnVivo() {
  if (!inputDorsal.value) {
    errorDorsalRepetido.value = 'El número de dorsal es obligatorio'
    return false
  }
  const num = Number(inputDorsal.value)
  if (isNaN(num) || num < 1 || num > 99) {
    errorDorsalRepetido.value = 'El dorsal debe ser un número entero entre 1 y 99'
    return false
  }
  const ocupado = dorsalesOcupadosEquipo.value.find(d => d.numero === num)
  if (ocupado) {
    errorDorsalRepetido.value = `⛔ El dorsal #${num} ya está ocupado por ${ocupado.nombre} en tu equipo. Cada jugador debe tener un número único.`
    return false
  }
  errorDorsalRepetido.value = ''
  return true
}

function seleccionarDorsalRapido(num) {
  inputDorsal.value = num
  validarDorsalEnVivo()
}

async function ejecutarCambioDorsal() {
  if (!validarDorsalEnVivo()) return
  if (!jugadorEditandoDorsal.value) return

  guardandoDorsal.value = true
  const jId = jugadorEditandoDorsal.value.id || jugadorEditandoDorsal.value._id
  const eqId = equipo.value?.id || equipo.value?._id
  const nuevoNumero = Number(inputDorsal.value)

  try {
    await store.cambiarDorsalJugador(jId, nuevoNumero, eqId)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `¡Dorsal #${nuevoNumero} asignado exitosamente! Tu camiseta oficial ha sido actualizada.`,
      position: 'top',
      timeout: 3500
    })
    mostrarModalDorsal.value = false
  } catch (err) {
    errorDorsalRepetido.value = err.message || 'No se pudo actualizar el dorsal'
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al actualizar el dorsal',
      position: 'top',
      timeout: 4000
    })
  } finally {
    guardandoDorsal.value = false
  }
}

const clubesVisibles = computed(() => {
  // Equipos cancelados / rechazados no deben figurar en la pestaña Clubes
  return (store.equipos || []).filter(e => e.estadoAprobacion !== 'Rechazado')
})

watch(() => store.miEquipoId, (id) => {
  if (id && (store.esEntrenador || store.esJugador)) {
    seleccionId.value = String(id).trim()
  }
}, { immediate: true })

async function completarPlantelClub(equipoId) {
  completandoPlantel.value = true
  try {
    const res = await store.completarPlantelEquipo(equipoId)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: res.msg || 'Plantel completado a 11 jugadores reglamentarios.',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al completar el plantel',
      position: 'top',
      timeout: 3500
    })
  } finally {
    completandoPlantel.value = false
  }
}

function irAPizarraDT(equipoId) {
  router.push('/entrenador')
}

const equipo = computed(() => {
  if (seleccionId.value) {
    const e = store.equipoPorId(seleccionId.value)
    if (e) return e
  }
  if (store.miEquipoId) {
    const miClub = store.equipoPorId(store.miEquipoId)
    if (miClub) return miClub
  }
  return clubesVisibles.value[0] || store.equipos[0] || null
})

const todosLosJugadoresDelClub = computed(() => {
  if (!equipo.value) return []
  const eqId = String(equipo.value.id || equipo.value._id || '').trim()
  return store.jugadores.filter(j => {
    const jEqId = String(j.equipoId || (j.equipo && typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo) || '').trim()
    return jEqId === eqId && j.estadoAprobacion !== 'Rechazado'
  })
})

const plantel = computed(() => {
  if (!equipo.value) return []
  return todosLosJugadoresDelClub.value
})

const headerGradient = computed(() => {
  const c = equipo.value?.color || equipo.value?.escudocolor || '#059669'
  return `linear-gradient(135deg, #090d16 0%, ${c} 100%)`
})
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
.club-avatar-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.active-club-item {
  background-color: #f0fdf4 !important;
  border-left: 3px solid #059669;
}
.club-header-banner {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.opacity-80 {
  opacity: 0.8;
}
.opacity-90 {
  opacity: 0.9;
}
.table-responsive {
  overflow-x: auto;
  width: 100%;
}
.roster-table {
  width: 100%;
  border-collapse: collapse;
}
.roster-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 10px 12px;
  border-bottom: 2px solid #e2e8f0;
}
.roster-table tbody td {
  padding: 10px 12px;
  font-size: 0.88rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.roster-row:hover {
  background-color: #f8fafc;
}
.pos-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  display: inline-block;
}
.pos-badge-banca {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px dashed #94a3b8;
}
.pos-badge-cancha {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  font-weight: 700;
}
.card-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 0.68rem;
  font-weight: 700;
}
.player-jersey-box {
  width: 52px;
  height: 52px;
  background: #3730a3;
  color: white;
  border-radius: 10px;
  font-weight: 800;
  border: 2px solid #818cf8;
}
.jersey-number {
  font-size: 1.35rem;
  letter-spacing: -1px;
}
.dorsal-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #e0e7ff;
  color: #3730a3;
  font-size: 0.85rem;
}

.club-list-badge-box {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  max-width: 32px;
  max-height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}
.club-list-badge-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.club-list-badge-emoji {
  font-size: 18px;
  line-height: 1;
}
.club-list-badge-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
}
.escudo-view-box {
  width: 64px;
  height: 64px;
  min-width: 64px;
  min-height: 64px;
  max-width: 64px;
  max-height: 64px;
  border-radius: 12px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}
.escudo-view-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.escudo-view-emoji {
  font-size: 34px;
  line-height: 1;
}

</style>
