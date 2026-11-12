import { createRouter, createWebHistory } from 'vue-router'
import PosicionesView from '../views/PosicionesView.vue'
import FixtureView from '../views/FixtureView.vue'
import EquiposView from '../views/EquiposView.vue'
import RankingView from '../views/RankingView.vue'
import EntrenadorView from '../views/EntrenadorView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: PosicionesView },
    { path: '/fixture', component: FixtureView },
    { path: '/equipos', component: EquiposView },
    { path: '/ranking', component: RankingView },
    { path: '/entrenador', component: EntrenadorView },
    { path: '/inscripcion', redirect: '/equipos' }
  ]
})
