// src/components/LobbyPage.js
// ---------------------------
// P\u00e1gina de Lobby (pantalla principal).
// Muestra:
//  - Sidebar izquierdo con navegaci\u00f3n.
//  - Cabecera con b\u00fasquedas, bot\u00f3n de depositar, notificaciones y perfil.
//  - Contenido central: banner promocional y listado de juegos.
//  - Secci\u00f3n inferior con actividad reciente.
//  - Sidebar derecho (Social) con bonos, amigos online y chat.

import React, { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { Bell, Menu as MenuIcon, X as XIcon, PlayCircle, Search, Swords, LogOut, Users, MessageSquare, ExternalLink, Award, ThumbsUp, Gift, ShieldCheck, Star, Home, Layers, BarChart2, ShoppingCart, Percent, LifeBuoy, User, Settings } from 'lucide-react';
import { auth, db, globalAppId } from '../firebase';
import { NavLink, GameCard } from './LobbyComponents';

function LobbyPage({ user, onLogout, navigateToGameRoom }) {
  const [userData, setUserData] = useState({ balance: 0, vipLevel: 1, displayName: '', avatar: '' });
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [onlineFriends, setOnlineFriends] = useState([]);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, `artifacts/${globalAppId}/users/${user.uid}/profile`, 'data');
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) setUserData(docSnap.data());
          else console.log("\u00a1No existe documento de perfil de usuario!");
        },
        (error) => console.error("Error al leer perfil de usuario:", error)
      );
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const mockFriends = [
      { id: 'friend1', name: 'AmigoJuan', status: 'online', avatar: 'https://placehold.co/32x32/7B68EE/FFFFFF?text=AJ' },
      { id: 'friend2', name: 'JugadoraAna', status: 'online', avatar: 'https://placehold.co/32x32/34D399/FFFFFF?text=JA' },
      { id: 'friend3', name: 'ProPlayerX', status: 'offline', avatar: 'https://placehold.co/32x32/F87171/FFFFFF?text=PX' },
    ];
    setOnlineFriends(mockFriends.filter(f => f.status === 'online'));
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar izquierdo */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-800 border-r border-slate-700/60
          transition-transform duration-300 ease-in-out md:static md:translate-x-0
          ${isLeftSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-20'}
          md:hover:w-64 group/sidebar overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/60 shrink-0">
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            className="flex items-center space-x-2 text-sky-400"
          >
            <PlayCircle size={28} />
            <span
              className={`font-bold text-xl ${isLeftSidebarOpen ? 'opacity-100' : 'md:opacity-0 group-hover/sidebar:opacity-100'} transition-opacity duration-200`}
            >
              MiCasino
            </span>
          </a>
          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="md:hidden text-slate-400 hover:text-sky-400"
          >
            <XIcon size={24} />
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-1.5">
          <NavLink icon={Home} text="Inicio" isActive={true} />
          <NavLink icon={Layers} text="Juegos de Casino" />
          <NavLink
            icon={Swords}
            text="Ca\u00edda (Espa\u00f1ola)"
            action={() => navigateToGameRoom('caida-default')}
          />
          <NavLink icon={BarChart2} text="Torneos" />
          <NavLink icon={Star} text="Club VIP" />
          <NavLink icon={Gift} text="Promociones" />
          <NavLink icon={ShoppingCart} text="Tienda" />

          <div className="pt-4 mt-4 border-t border-slate-700/60">
            <span
              className={`px-3 text-xs font-semibold text-slate-500 uppercase ${
                isLeftSidebarOpen
                  ? 'opacity-100'
                  : 'md:opacity-0 group-hover/sidebar:opacity-100'
              } transition-opacity`}
            >
              Usuario
            </span>
          </div>
          <NavLink icon={User} text="Mi Perfil" />
          <NavLink icon={Percent} text="Mis Bonos" />
          <NavLink icon={Settings} text="Ajustes" />
          <NavLink icon={LifeBuoy} text="Soporte en Vivo" />
        </nav>

        <div
          className={`p-4 border-t border-slate-700/60 mt-auto ${
            isLeftSidebarOpen
              ? 'opacity-100'
              : 'md:opacity-0 group-hover/sidebar:opacity-100'
          } transition-opacity`}
        >
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Casino Royal</p>
          <p className="text-xs text-slate-600">App ID: {globalAppId}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-800/80 backdrop-blur-md shadow-md h-16 flex items-center justify-between px-6 shrink-0 border-b border-slate-700/60">
          <div className="flex items-center">
            <button
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className="md:hidden text-slate-400 hover:text-sky-400 mr-4"
            >
              <MenuIcon size={24} />
            </button>
            <div className="relative hidden md:block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                placeholder="Buscar juegos..."
                className="bg-slate-700/50 border border-slate-600/70 text-slate-300 text-sm rounded-lg pl-10 pr-3 py-2 w-64 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 md:space-x-4">
            <button className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-900 font-semibold px-3 sm:px-5 py-2 rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-1 sm:space-x-1.5">
              <Gift size={16} />
              <span className="hidden sm:inline">Depositar</span>
            </button>
            <button className="text-slate-400 hover:text-sky-400 relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            <div className="flex items-center space-x-2 p-1 pr-2 sm:pr-3 rounded-lg bg-slate-700/50 border border-slate-600/70">
              <img
                src={
                  userData?.avatar ||
                  `https://placehold.co/36x36/8B5CF6/FFFFFF?text=${(
                    userData?.displayName ||
                    user.email ||
                    'U'
                  ).charAt(0).toUpperCase()}`
                }
                alt="Avatar Usuario"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-md object-cover"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">
                  {userData?.displayName || user.email}
                </p>
                <p className="text-xs text-sky-400 leading-tight">VIP Nivel {userData?.vipLevel || 1}</p>
              </div>
            </div>

            <p className="text-sm font-bold text-yellow-400 hidden md:block">
              C${(userData?.balance || 0).toLocaleString('es-NI', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>

            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-red-500 p-1.5 sm:p-2 rounded-md hover:bg-slate-700 transition-colors"
              title="Cerrar Sesi\u00f3n"
            >
              <LogOut size={18} />
            </button>

            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="lg:hidden text-slate-400 hover:text-sky-400"
            >
              <Users size={22} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
          <div className="relative bg-gradient-to-r from-sky-600 to-indigo-700 p-6 md:p-12 rounded-xl shadow-2xl mb-8 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{
                backgroundImage: "url('https://placehold.co/1200x400/000000/FFFFFF?text=Casino+Banner+Texture')"
              }}
            ></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">Juega Ca\u00edda Espa\u00f1ola</h2>
              <p className="text-md md:text-lg text-sky-200 mb-6 max-w-2xl">
                Experimenta la emoci\u00f3n del cl\u00e1sico juego de cartas. \u00a1Crea tu mesa o \u00faanete a una existente!
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => navigateToGameRoom('new-caida-game')}
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <Swords size={20} />
                  <span>Crear Partida de Ca\u00edda</span>
                </button>
                <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors backdrop-blur-sm">
                  Ver Mesas P\u00fablicas
                </button>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h3 className="text-2xl font-semibold text-sky-300 mb-5">Logros Destacados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { title: "Rey de la Ca\u00edda", icon: Award, progress: 75, color: "sky" },
                { title: "Mano Maestra", icon: ThumbsUp, progress: 50, color: "green" },
                { title: "Gran Apostador", icon: Gift, progress: 90, color: "purple" },
                { title: "Invicto", icon: ShieldCheck, progress: 30, color: "yellow" }
              ].map(ach => (
                <div
                  key={ach.title}
                  className={`bg-slate-800 p-5 rounded-xl shadow-lg border-l-4 border-${ach.color}-500`}
                >
                  <ach.icon size={28} className={`text-${ach.color}-400 mb-2`} />
                  <h4 className="text-lg font-semibold text-white mb-1">{ach.title}</h4>
                  <p className="text-xs text-slate-400 mb-2">Completa para ganar recompensas</p>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div
                      className={`bg-${ach.color}-500 h-2.5 rounded-full`}
                      style={{ width: `${ach.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-semibold text-sky-300 mb-5">Otros Juegos Populares</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <GameCard
                title="Ca\u00edda Cl\u00e1sica"
                category="Cartas Espa\u00f1olas"
                players="10 Activos"
                imageUrl="https://placehold.co/600x400/0F172A/38BDF8?text=Ca\u00edda+Espa\u00f1ola"
                bgColor="bg-slate-800"
                onPlayClick={() => navigateToGameRoom('caida-classic-1')}
              />
              <GameCard
                title="Ruleta Europea VIP"
                category="Juegos de Mesa"
                players="15 Activos"
                imageUrl="https://images.unsplash.com/photo-1593136949936-6800c020969e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cm91bGV0dGUlMjBjYXNpbm98ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"
                bgColor="bg-slate-800"
                onPlayClick={() => console.log("Ir a Ruleta no implementado")}
              />
              <GameCard
                title="Blackjack Deluxe"
                category="Cartas"
                players="25 Activos"
                imageUrl="https://images.unsplash.com/photo-1542042102-248260769303?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YmxhY2tqYWNrJTIwY2FzaW5vfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"
                bgColor="bg-slate-800"
                onPlayClick={() => console.log("Ir a Blackjack no implementado")}
              />
              <GameCard
                title="Slots: Tesoros Aztecas"
                category="Tragamonedas"
                players="30 Activos"
                imageUrl="https://images.unsplash.com/photo-1609098003901-81820ff07999?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2xvdCUyMG1hY2hpbmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"
                bgColor="bg-slate-800"
                onPlayClick={() => console.log("Ir a Slots no implementado")}
              />
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-2xl font-semibold text-sky-300 mb-5">Actividad Reciente</h3>
            <div className="bg-slate-800 rounded-xl shadow-lg overflow-x-auto">
              <table className="w-full min-w-max text-sm text-left text-slate-300">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3">Juego</th>
                    <th scope="col" className="px-6 py-3">Jugador</th>
                    <th scope="col" className="px-6 py-3">Hora</th>
                    <th scope="col" className="px-6 py-3">Apuesta</th>
                    <th scope="col" className="px-6 py-3">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { game: "Ca\u00edda Espa\u00f1ola", player: "JugadorX21", time: "Hace 2 min", bet: "C$50", gain: "C$150" },
                    { game: "Ruleta VIP", player: "AnaLucky7", time: "Hace 5 min", bet: "C$100", gain: "C$3500" },
                    { game: "Blackjack", player: "ElProfe", time: "Hace 8 min", bet: "C$200", gain: "C$400" }
                  ].map((activity, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{activity.game}</td>
                      <td className="px-6 py-4">{activity.player}</td>
                      <td className="px-6 py-4">{activity.time}</td>
                      <td className="px-6 py-4 text-slate-400">{activity.bet}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">{activity.gain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <aside
        className={`
          fixed inset-y-0 right-0 z-20 flex flex-col bg-slate-800/90 backdrop-blur-sm border-l border-slate-700/60
          transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 w-72
          ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/60 shrink-0">
          <h2 className="text-lg font-semibold text-sky-400">Social</h2>
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-sky-400"
          >
            <XIcon size={24} />
          </button>
        </div>

        <div className="flex-grow p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-lg shadow-lg text-white">
            <Gift size={20} className="mb-1.5" />
            <h4 className="font-bold text-sm">Bono Gratis Diario</h4>
            <p className="text-xs opacity-80 mb-2">\u00a1Reclama tu recompensa ahora!</p>
            <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-xs font-bold py-1.5 rounded transition-colors">
              Reclamar
            </button>
          </div>

          <div className="bg-slate-700 p-4 rounded-lg shadow-lg text-white border border-slate-600">
            <Star size={20} className="mb-1.5 text-yellow-400" />
            <h4 className="font-bold text-sm">Programa VIP</h4>
            <p className="text-xs opacity-80 mb-2">M\u00e1s juegos, m\u00e1s premios.</p>
            <button className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-1.5 rounded transition-colors">
              Saber M\u00e1s
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Amigos ({onlineFriends.length} Conectados)
            </h3>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                placeholder="Buscar amigos..."
                className="bg-slate-700/70 border border-slate-600 text-slate-300 text-xs rounded-md pl-8 pr-2 py-1.5 w-full focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 pr-1">
              {onlineFriends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center justify-between p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-7 h-7 rounded-full object-cover border-2 border-green-500"
                    />
                    <span className="text-sm text-slate-200">{friend.name}</span>
                  </div>
                  <button className="text-sky-400 hover:text-sky-300">
                    <MessageSquare size={16} />
                  </button>
                </li>
              ))}
              <li className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-md transition-colors cursor-pointer opacity-60">
                <div className="flex items-center space-x-2">
                  <img
                    src="https://placehold.co/32x32/6B7280/FFFFFF?text=PO"
                    alt="Offline Friend"
                    className="w-7 h-7 rounded-full object-cover border-2 border-slate-500"
                  />
                  <span className="text-sm text-slate-400">PlayerOffline</span>
                </div>
              </li>
              <li className="flex items-center justify-between p-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-md transition-colors cursor-pointer">
                <div className="flex items-center space-x-2">
                  <img
                    src="https://placehold.co/32x32/F59E0B/FFFFFF?text=FR"
                    alt="Friend Request"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-sm text-yellow-300">SolicitudAmigo</span>
                </div>
                <div className="flex space-x-1">
                  <button className="p-1 bg-green-500/20 hover:bg-green-500/40 rounded">
                    <ThumbsUp size={14} className="text-green-400" />
                  </button>
                  <button className="p-1 bg-red-500/20 hover:bg-red-500/40 rounded">
                    <XIcon size={14} className="text-red-400" />
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex flex-col flex-grow min-h-[200px]">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Chat General</h3>
            <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-3 mb-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 h-40">
              <div className="text-xs mb-2">
                <span className="font-semibold text-sky-400">Sistema:</span>
                <span className="text-slate-300">\u00a1Bienvenido al Casino Royal!</span>
              </div>
              <div className="text-xs mb-2">
                <span className="font-semibold text-green-400">AmigoJuan:</span>
                <span className="text-slate-300">\u00a1Hola a todos! \u00bfAlguien para una partida de Ca\u00edda? \ud83d\ude0e</span>
              </div>
              <div className="text-xs mb-2">
                <span className="font-semibold text-purple-400">{userData?.displayName || 'T\u00fa'}:</span>
                <span className="text-slate-300">\u00a1Yo me apunto en un momento! \ud83d\udd25</span>
              </div>
            </div>
            <div className="flex">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 p-2.5 bg-slate-700 border border-slate-600 rounded-l-lg text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
              />
              <button className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-r-lg text-sm font-medium transition-colors">
                Enviar
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700/60 mt-auto text-center">
          <button className="text-xs text-slate-400 hover:text-sky-300 hover:underline flex items-center justify-center space-x-1.5 w-full">
            <ExternalLink size={14} />
            <span>Invitar Amigos</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default LobbyPage;
