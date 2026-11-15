/**
 * Default "Guías" content for MU Breda (Info -> Guías).
 * Editable later via AdminCP -> Guides (stored in cms-local.json; null = these defaults).
 * Texts are { es, en, pt }. Item bodies and the intro are HTML (p, strong, em, ul/ol/li, table,
 * h3/h4, a, img, youtube iframe), sanitized on save. Game proper names stay the same in every language.
 */
function L(es, en, pt) {
  return { es, en: en || es, pt: pt || en || es };
}

function item(id, title, body) {
  return { id, title, body };
}

/** Icon names allowed for categories (react-icons/fa components, mapped in the front). */
export const GUIDE_ICONS = [
  'FaCoins',
  'FaMapMarkedAlt',
  'FaSkull',
  'FaShieldAlt',
  'FaFistRaised',
  'FaHatWizard',
  'FaUsers',
  'FaCog',
  'FaBook',
  'FaScroll',
  'FaStar',
  'FaGem',
];

export const GUIDES_DEFAULTS = {
  updatedAt: null,
  intro: L(
    `<p>Mu Breda suma al Season 6 clásico una moneda propia (Ruud), sets ancient Bloodangel, un mapa nuevo con jefes y quests diarias, dungeons por rango de resets, un sistema VIP, el Combat Quiver para la Elf, un ciclo de día y noche y varias ventanas de ayuda. Esta guía explica qué hace cada sistema, cómo se usa y con qué tecla o comando se abre. Los valores (cantidades, precios, horarios) son los de lanzamiento y el staff los puede ajustar.</p>`,
    `<p>Mu Breda adds to classic Season 6 its own currency (Ruud), ancient Bloodangel sets, a new map with bosses and daily quests, dungeons by reset range, a VIP system, the Combat Quiver for the Elf, a day and night cycle and several help windows. This guide explains what each system does, how to use it and which key or command opens it. Values (amounts, prices, schedules) are the launch ones and the staff may adjust them.</p>`,
    `<p>O Mu Breda soma ao Season 6 clássico uma moeda própria (Ruud), sets ancient Bloodangel, um mapa novo com chefes e quests diárias, dungeons por faixa de resets, um sistema VIP, o Combat Quiver para a Elf, um ciclo de dia e noite e várias janelas de ajuda. Este guia explica o que cada sistema faz, como se usa e com qual tecla ou comando se abre. Os valores (quantidades, preços, horários) são os de lançamento e o staff pode ajustá-los.</p>`,
  ),
  categories: [
    {
      id: 'economy',
      icon: 'FaCoins',
      title: L('Economía', 'Economy', 'Economia'),
      items: [
        item(
          'ruud-priest-james',
          L('Ruud y Priest James', 'Ruud and Priest James', 'Ruud e Priest James'),
          L(
            `<p>El Ruud es una moneda aparte del zen: se gana jugando contenido difícil y se gasta en Priest James, el único que vende los sets Bloodangel. Tu saldo se ve en el inventario, en la fila debajo del zen, y con el comando /ruud.</p>
<p><strong>Hace falta tener 15 resets.</strong> Con menos resets no ganás Ruud ni podés comprarle a Priest James.</p>
<table><thead><tr><th>Cómo se gana</th><th>Ruud</th></tr></thead><tbody><tr><td>Matar a Abbadon, el jefe semanal (el primero del ranking de daño)</td><td>5000</td></tr><tr><td>Completar un dungeon (cada jugador del dungeon)</td><td>350</td></tr><tr><td>Quest diaria de jefe en Ruined Lorencia</td><td>350</td></tr><tr><td>Terminar Blood Castle, Devil Square o Chaos Castle</td><td>350</td></tr><tr><td>Quest diaria de 20 monstruos en Ruined Lorencia</td><td>350</td></tr><tr><td>Matar un jefe de Ruined Lorencia (el primero del ranking)</td><td>350</td></tr></tbody></table>
<p>Los eventos (dungeons, Blood Castle, Devil Square y Chaos Castle) pagan Ruud como máximo 3 veces por día por personaje.</p>
<p><strong>Priest James</strong> está en la zona segura de Ruined Lorencia (21, 240). Cada personaje ve solo lo de su clase:</p>
<ul><li>Las piezas selladas de su set (4 piezas; Elf y Magic Gladiator ven 8, porque tienen dos sets): 50.000 Ruud cada una.</li><li>(Hero) Blood Angels Spirit, para liberar las piezas: 2.000 Ruud.</li><li>El arma Bloodangel de su clase: 100.000 Ruud.</li><li>Jewels: Bless y Soul 100, Chaos 50, Life 150, Creation 200.</li></ul>`,
            `<p>Ruud is a currency separate from zen: you earn it by playing hard content and spend it at Priest James, the only vendor of the Bloodangel sets. Your balance shows in the inventory, on the row below zen, and with the /ruud command.</p>
<p><strong>You need 15 resets.</strong> With fewer resets you don't earn Ruud and can't buy from Priest James.</p>
<table><thead><tr><th>How to earn it</th><th>Ruud</th></tr></thead><tbody><tr><td>Kill Abbadon, the weekly boss (top of the damage ranking)</td><td>5000</td></tr><tr><td>Complete a dungeon (every player in the dungeon)</td><td>350</td></tr><tr><td>Daily boss quest in Ruined Lorencia</td><td>350</td></tr><tr><td>Finish Blood Castle, Devil Square or Chaos Castle</td><td>350</td></tr><tr><td>Daily 20-monster quest in Ruined Lorencia</td><td>350</td></tr><tr><td>Kill a Ruined Lorencia boss (top of the ranking)</td><td>350</td></tr></tbody></table>
<p>Events (dungeons, Blood Castle, Devil Square and Chaos Castle) pay Ruud at most 3 times per day per character.</p>
<p><strong>Priest James</strong> is in the Ruined Lorencia safe zone (21, 240). Each character only sees what belongs to its class:</p>
<ul><li>The sealed pieces of its set (4 pieces; Elf and Magic Gladiator see 8, because they have two sets): 50,000 Ruud each.</li><li>(Hero) Blood Angels Spirit, to unseal the pieces: 2,000 Ruud.</li><li>The Bloodangel weapon of its class: 100,000 Ruud.</li><li>Jewels: Bless and Soul 100, Chaos 50, Life 150, Creation 200.</li></ul>`,
            `<p>O Ruud é uma moeda separada do zen: você ganha jogando conteúdo difícil e gasta no Priest James, o único que vende os sets Bloodangel. Seu saldo aparece no inventário, na linha embaixo do zen, e com o comando /ruud.</p>
<p><strong>É preciso ter 15 resets.</strong> Com menos resets você não ganha Ruud nem pode comprar do Priest James.</p>
<table><thead><tr><th>Como ganhar</th><th>Ruud</th></tr></thead><tbody><tr><td>Matar o Abbadon, o chefe semanal (o primeiro do ranking de dano)</td><td>5000</td></tr><tr><td>Completar um dungeon (cada jogador do dungeon)</td><td>350</td></tr><tr><td>Quest diária de chefe em Ruined Lorencia</td><td>350</td></tr><tr><td>Terminar Blood Castle, Devil Square ou Chaos Castle</td><td>350</td></tr><tr><td>Quest diária de 20 monstros em Ruined Lorencia</td><td>350</td></tr><tr><td>Matar um chefe de Ruined Lorencia (o primeiro do ranking)</td><td>350</td></tr></tbody></table>
<p>Os eventos (dungeons, Blood Castle, Devil Square e Chaos Castle) pagam Ruud no máximo 3 vezes por dia por personagem.</p>
<p><strong>Priest James</strong> fica na zona segura de Ruined Lorencia (21, 240). Cada personagem vê só o da sua classe:</p>
<ul><li>As peças seladas do seu set (4 peças; Elf e Magic Gladiator veem 8, porque têm dois sets): 50.000 Ruud cada uma.</li><li>(Hero) Blood Angels Spirit, para liberar as peças: 2.000 Ruud.</li><li>A arma Bloodangel da sua classe: 100.000 Ruud.</li><li>Jewels: Bless e Soul 100, Chaos 50, Life 150, Creation 200.</li></ul>`,
          ),
        ),
        item(
          'bloodangel-sets',
          L('Sets y armas Bloodangel', 'Bloodangel sets and weapons', 'Sets e armas Bloodangel'),
          L(
            `<p>Los sets Bloodangel ancient se arman con piezas selladas que se liberan en la Chaos Machine. Cada set tiene 4 piezas; la quinta parte del equipo se completa con una pieza excelente.</p>
<p><strong>Cómo conseguir una pieza:</strong></p>
<ol><li>Comprale a Priest James la pieza sellada que quieras y un (Hero) Blood Angels Spirit.</li><li>Llevá las dos al Chaos Goblin y elegí <strong>Regular Combination</strong>.</li><li>Combiná: sale siempre (100%) y no cobra zen.</li><li>La pieza sale +0, ancient, con una opción de stat al azar (+5 o +10 del stat principal del set) y 25% de chance de luck.</li></ol>
<table><thead><tr><th>Set</th><th>Clase</th><th>Piezas</th></tr></thead><tbody><tr><td>Fury</td><td>Dark Knight</td><td>Casco, armadura, pantalón, botas</td></tr><tr><td>Transcendence</td><td>Dark Wizard</td><td>Casco, armadura, pantalón, guantes</td></tr><tr><td>Flurry</td><td>Elf de agilidad</td><td>Casco, armadura, pantalón, guantes</td></tr><tr><td>Salvation</td><td>Elf de energía (support)</td><td>Casco, armadura, pantalón, guantes</td></tr><tr><td>Honor</td><td>Summoner</td><td>Casco, armadura, pantalón, guantes</td></tr><tr><td>Extremity</td><td>Magic Gladiator de fuerza</td><td>Armadura, pantalón, guantes, botas</td></tr><tr><td>Captivation</td><td>Magic Gladiator de energía</td><td>Armadura, pantalón, guantes, botas</td></tr><tr><td>Conquest</td><td>Dark Lord</td><td>Casco, armadura, pantalón, guantes</td></tr><tr><td>Destruction</td><td>Rage Fighter</td><td>Casco, armadura, pantalón, botas</td></tr></tbody></table>
<p><strong>Bonus del set</strong> (todos menos Salvation):</p>
<ul><li>2 piezas: daño de skill +25 y +50 al stat principal.</li><li>3 piezas: doble daño 10% y +50 de daño (o de wizardry en los sets de energía).</li><li>4 piezas: además, crítico y excelente +15%, ignorar defensa 5%, todos los stats +10, defensa +20, daño crítico y excelente +30.</li></ul>
<p><strong>Salvation</strong> está hecho para la Elf que buffea: potencia los buffs que tira a los demás. Con 2 piezas da +50 de energía y +7% al aura de daño; con 3, +7% al aura de defensa y +7% de defensa con escudo; con 4, vida extra, defensa y todos los stats +10.</p>
<p>Las piezas no piden nivel, solo stats, y se pueden usar desde la primera clase.</p>
<p><strong>Armas:</strong> se compran directamente a Priest James y salen excelentes, con la opción de daño excelente y otra opción al azar. Con 5% de suerte salen con dos opciones al azar.</p>
<p><strong>Otra forma de conseguir el (Hero) Blood Angels Spirit:</strong> en la Chaos Machine, una pieza ancient de armadura (casco, armadura, pantalón, guantes o botas) +11 o superior de los sets Vicious/Hyon, Anubis/Enis, Aruan/Gywen, Gaion/Muren, Broy/Agnis, Semeden/Chrono o Vega/Chamer da un (Hero) Blood Angels Spirit con 80% de éxito, sin costo de zen.</p>`,
            `<p>The ancient Bloodangel sets are built from sealed pieces that you unseal at the Chaos Machine. Each set has 4 pieces; the fifth part of the gear is completed with an excellent piece.</p>
<p><strong>How to get a piece:</strong></p>
<ol><li>Buy the sealed piece you want from Priest James, plus a (Hero) Blood Angels Spirit.</li><li>Take both to the Chaos Goblin and choose <strong>Regular Combination</strong>.</li><li>Combine: it always works (100%) and costs no zen.</li><li>The piece comes out +0, ancient, with a random stat option (+5 or +10 of the set's main stat) and a 25% chance of luck.</li></ol>
<table><thead><tr><th>Set</th><th>Class</th><th>Pieces</th></tr></thead><tbody><tr><td>Fury</td><td>Dark Knight</td><td>Helm, armor, pants, boots</td></tr><tr><td>Transcendence</td><td>Dark Wizard</td><td>Helm, armor, pants, gloves</td></tr><tr><td>Flurry</td><td>Agility Elf</td><td>Helm, armor, pants, gloves</td></tr><tr><td>Salvation</td><td>Energy Elf (support)</td><td>Helm, armor, pants, gloves</td></tr><tr><td>Honor</td><td>Summoner</td><td>Helm, armor, pants, gloves</td></tr><tr><td>Extremity</td><td>Strength Magic Gladiator</td><td>Armor, pants, gloves, boots</td></tr><tr><td>Captivation</td><td>Energy Magic Gladiator</td><td>Armor, pants, gloves, boots</td></tr><tr><td>Conquest</td><td>Dark Lord</td><td>Helm, armor, pants, gloves</td></tr><tr><td>Destruction</td><td>Rage Fighter</td><td>Helm, armor, pants, boots</td></tr></tbody></table>
<p><strong>Set bonus</strong> (all except Salvation):</p>
<ul><li>2 pieces: skill damage +25 and +50 to the main stat.</li><li>3 pieces: double damage 10% and +50 damage (or wizardry in the energy sets).</li><li>4 pieces: also critical and excellent +15%, ignore defense 5%, all stats +10, defense +20, critical and excellent damage +30.</li></ul>
<p><strong>Salvation</strong> is made for the Elf who buffs: it boosts the buffs you cast on others. With 2 pieces it gives +50 energy and +7% to the damage aura; with 3, +7% to the defense aura and +7% defense with a shield; with 4, extra life, defense and all stats +10.</p>
<p>Pieces don't require level, only stats, and can be used from the first class.</p>
<p><strong>Weapons:</strong> you buy them directly from Priest James and they come out excellent, with the excellent damage option and another random option. With 5% luck they come out with two random options.</p>
<p><strong>Another way to get the (Hero) Blood Angels Spirit:</strong> in the Chaos Machine, one ancient armor piece (helm, armor, pants, gloves or boots) +11 or higher from the sets Vicious/Hyon, Anubis/Enis, Aruan/Gywen, Gaion/Muren, Broy/Agnis, Semeden/Chrono or Vega/Chamer gives a (Hero) Blood Angels Spirit with 80% success, at no zen cost.</p>`,
            `<p>Os sets Bloodangel ancient se montam com peças seladas que são liberadas na Chaos Machine. Cada set tem 4 peças; a quinta parte do equipamento se completa com uma peça excelente.</p>
<p><strong>Como conseguir uma peça:</strong></p>
<ol><li>Compre do Priest James a peça selada que quiser e um (Hero) Blood Angels Spirit.</li><li>Leve as duas ao Chaos Goblin e escolha <strong>Regular Combination</strong>.</li><li>Combine: sai sempre (100%) e não cobra zen.</li><li>A peça sai +0, ancient, com uma opção de stat aleatória (+5 ou +10 do stat principal do set) e 25% de chance de luck.</li></ol>
<table><thead><tr><th>Set</th><th>Classe</th><th>Peças</th></tr></thead><tbody><tr><td>Fury</td><td>Dark Knight</td><td>Capacete, armadura, calça, botas</td></tr><tr><td>Transcendence</td><td>Dark Wizard</td><td>Capacete, armadura, calça, luvas</td></tr><tr><td>Flurry</td><td>Elf de agilidade</td><td>Capacete, armadura, calça, luvas</td></tr><tr><td>Salvation</td><td>Elf de energia (support)</td><td>Capacete, armadura, calça, luvas</td></tr><tr><td>Honor</td><td>Summoner</td><td>Capacete, armadura, calça, luvas</td></tr><tr><td>Extremity</td><td>Magic Gladiator de força</td><td>Armadura, calça, luvas, botas</td></tr><tr><td>Captivation</td><td>Magic Gladiator de energia</td><td>Armadura, calça, luvas, botas</td></tr><tr><td>Conquest</td><td>Dark Lord</td><td>Capacete, armadura, calça, luvas</td></tr><tr><td>Destruction</td><td>Rage Fighter</td><td>Capacete, armadura, calça, botas</td></tr></tbody></table>
<p><strong>Bônus do set</strong> (todos menos Salvation):</p>
<ul><li>2 peças: dano de skill +25 e +50 no stat principal.</li><li>3 peças: dano duplo 10% e +50 de dano (ou de wizardry nos sets de energia).</li><li>4 peças: além disso, crítico e excelente +15%, ignorar defesa 5%, todos os stats +10, defesa +20, dano crítico e excelente +30.</li></ul>
<p><strong>Salvation</strong> foi feito para a Elf que buffa: potencializa os buffs que ela lança nos outros. Com 2 peças dá +50 de energia e +7% na aura de dano; com 3, +7% na aura de defesa e +7% de defesa com escudo; com 4, vida extra, defesa e todos os stats +10.</p>
<p>As peças não pedem nível, só stats, e podem ser usadas desde a primeira classe.</p>
<p><strong>Armas:</strong> são compradas direto do Priest James e saem excelentes, com a opção de dano excelente e outra opção aleatória. Com 5% de sorte saem com duas opções aleatórias.</p>
<p><strong>Outra forma de conseguir o (Hero) Blood Angels Spirit:</strong> na Chaos Machine, uma peça ancient de armadura (capacete, armadura, calça, luvas ou botas) +11 ou superior dos sets Vicious/Hyon, Anubis/Enis, Aruan/Gywen, Gaion/Muren, Broy/Agnis, Semeden/Chrono ou Vega/Chamer dá um (Hero) Blood Angels Spirit com 80% de sucesso, sem custo de zen.</p>`,
          ),
        ),
        item(
          'vip',
          L('VIP', 'VIP', 'VIP'),
          L(
            `<p>El VIP es un beneficio de la cuenta (vale para todos sus personajes) que se compra con WCoin C desde el menú principal: <strong>F6 → VIP</strong>. La ventana muestra cuántos días te quedan, los beneficios, el precio y tu saldo.</p>
<ul><li><strong>Precio:</strong> 5.000 WCoin C por 30 días. Si volvés a comprar, los días se suman a los que te quedan.</li><li><strong>Chaos Machine:</strong> +5% de éxito en todas las combinaciones.</li><li><strong>Jewel of Soul y Jewel of Life:</strong> +5% de éxito.</li><li><strong>Experiencia:</strong> +5% de experiencia normal y +5% de experiencia master.</li></ul>`,
            `<p>VIP is an account benefit (it applies to all its characters) that you buy with WCoin C from the main menu: <strong>F6 → VIP</strong>. The window shows how many days you have left, the benefits, the price and your balance.</p>
<ul><li><strong>Price:</strong> 5,000 WCoin C for 30 days. If you buy again, the days add up to the ones you have left.</li><li><strong>Chaos Machine:</strong> +5% success on all combinations.</li><li><strong>Jewel of Soul and Jewel of Life:</strong> +5% success.</li><li><strong>Experience:</strong> +5% normal experience and +5% master experience.</li></ul>`,
            `<p>O VIP é um benefício da conta (vale para todos os seus personagens) que se compra com WCoin C no menu principal: <strong>F6 → VIP</strong>. A janela mostra quantos dias restam, os benefícios, o preço e o seu saldo.</p>
<ul><li><strong>Preço:</strong> 5.000 WCoin C por 30 dias. Se você comprar de novo, os dias são somados aos que restam.</li><li><strong>Chaos Machine:</strong> +5% de sucesso em todas as combinações.</li><li><strong>Jewel of Soul e Jewel of Life:</strong> +5% de sucesso.</li><li><strong>Experiência:</strong> +5% de experiência normal e +5% de experiência master.</li></ul>`,
          ),
        ),
      ],
    },
    {
      id: 'maps-bosses',
      icon: 'FaSkull',
      title: L('Mapas y jefes', 'Maps and bosses', 'Mapas e chefes'),
      items: [
        item(
          'ruined-lorencia',
          L('Ruined Lorencia', 'Ruined Lorencia', 'Ruined Lorencia'),
          L(
            `<p>Ruined Lorencia es un mapa nuevo para nivel 150 o más, con monstruos fuertes, cinco jefes de campo y un jefe semanal. Se entra con /move Ruined_Lorencia (10.000 zen).</p>
<ul><li><strong>Monstruos:</strong> Elite Lich, Elite Giant, Elite Skeleton, Dead Digger y Dead Shoveler.</li><li><strong>Jefes de campo</strong>, con respawn cada 10 minutos: Cerberus (156, 232), Lava Beast (230, 216), Lava Demon (237, 39), Red Centurion (121, 27) y Blue Centurion (51, 136).</li><li><strong>Abbadon, el jefe semanal:</strong> aparece los domingos a las 20:00 (hora del server) en el centro del mapa (139, 128), con aviso a todo el server. Se queda hasta que lo maten; si sigue vivo el domingo siguiente, no aparece otro.</li></ul>
<p><strong>Quests diarias.</strong> Archmage Vorlendis, en la zona segura (18, 240), da 10 quests que se renuevan todos los días: 5 de matar un jefe de campo y 5 de matar 20 monstruos (350 Ruud cada una). Hablale para ver las quests disponibles y aceptarlas.</p>`,
            `<p>Ruined Lorencia is a new map for level 150 or higher, with strong monsters, five field bosses and a weekly boss. You enter with /move Ruined_Lorencia (10,000 zen).</p>
<ul><li><strong>Monsters:</strong> Elite Lich, Elite Giant, Elite Skeleton, Dead Digger and Dead Shoveler.</li><li><strong>Field bosses</strong>, respawning every 10 minutes: Cerberus (156, 232), Lava Beast (230, 216), Lava Demon (237, 39), Red Centurion (121, 27) and Blue Centurion (51, 136).</li><li><strong>Abbadon, the weekly boss:</strong> appears on Sundays at 20:00 (server time) in the center of the map (139, 128), with an announcement to the whole server. He stays until someone kills him; if he's still alive the next Sunday, no other one spawns.</li></ul>
<p><strong>Daily quests.</strong> Archmage Vorlendis, in the safe zone (18, 240), gives 10 quests that renew every day: 5 to kill a field boss and 5 to kill 20 monsters (350 Ruud each). Talk to him to see the available quests and accept them.</p>`,
            `<p>Ruined Lorencia é um mapa novo para nível 150 ou mais, com monstros fortes, cinco chefes de campo e um chefe semanal. Entra-se com /move Ruined_Lorencia (10.000 zen).</p>
<ul><li><strong>Monstros:</strong> Elite Lich, Elite Giant, Elite Skeleton, Dead Digger e Dead Shoveler.</li><li><strong>Chefes de campo</strong>, com respawn a cada 10 minutos: Cerberus (156, 232), Lava Beast (230, 216), Lava Demon (237, 39), Red Centurion (121, 27) e Blue Centurion (51, 136).</li><li><strong>Abbadon, o chefe semanal:</strong> aparece aos domingos às 20:00 (hora do server) no centro do mapa (139, 128), com aviso para todo o server. Ele fica até que o matem; se continuar vivo no domingo seguinte, não aparece outro.</li></ul>
<p><strong>Quests diárias.</strong> O Archmage Vorlendis, na zona segura (18, 240), dá 10 quests que se renovam todo dia: 5 de matar um chefe de campo e 5 de matar 20 monstros (350 Ruud cada uma). Fale com ele para ver as quests disponíveis e aceitá-las.</p>`,
          ),
        ),
        item(
          'bosses-damage-ranking',
          L('Jefes y ranking de daño', 'Bosses and damage ranking', 'Chefes e ranking de dano'),
          L(
            `<p>En los jefes, el drop (y el Ruud) se lo lleva el jugador que más daño le hizo, no el que da el último golpe.</p>
<ul><li>Cerca de un jefe aparece arriba de la pantalla su barra de vida con el top 5 de daño.</li><li>Perdés el daño acumulado si te morís, si te alejás mucho o si dejás de pegarle 5 segundos.</li><li>Cuando alguien mata un jefe, todo el server se entera de quién fue y dónde.</li></ul>
<p><strong>Barras de vida:</strong> todos los monstruos y jugadores cercanos muestran una barra de vida (los jugadores, también la del escudo). Pasando el mouse por encima se ve el nombre, el nivel y la vida. Un "!" rojo sobre un monstruo avisa que te detectó y va hacia vos.</p>`,
            `<p>On bosses, the drop (and the Ruud) goes to the player who dealt the most damage, not the one who lands the last hit.</p>
<ul><li>Near a boss, its health bar appears at the top of the screen with the top 5 damage dealers.</li><li>You lose your accumulated damage if you die, if you move too far away or if you stop hitting it for 5 seconds.</li><li>When someone kills a boss, the whole server finds out who it was and where.</li></ul>
<p><strong>Health bars:</strong> all nearby monsters and players show a health bar (players also show the shield bar). Hovering the mouse over them shows the name, level and health. A red "!" over a monster means it detected you and is coming for you.</p>`,
            `<p>Nos chefes, o drop (e o Ruud) fica com o jogador que causou mais dano, não com quem dá o último golpe.</p>
<ul><li>Perto de um chefe aparece no topo da tela a barra de vida dele com o top 5 de dano.</li><li>Você perde o dano acumulado se morrer, se se afastar muito ou se parar de bater nele por 5 segundos.</li><li>Quando alguém mata um chefe, o server inteiro fica sabendo quem foi e onde.</li></ul>
<p><strong>Barras de vida:</strong> todos os monstros e jogadores próximos mostram uma barra de vida (nos jogadores, também a do escudo). Passando o mouse por cima você vê o nome, o nível e a vida. Um "!" vermelho sobre um monstro avisa que ele te detectou e está indo até você.</p>`,
          ),
        ),
        item(
          'dungeons',
          L('Dungeons', 'Dungeons', 'Dungeons'),
          L(
            `<p>Los dungeons son recorridos de hasta 5 jugadores con oleadas de monstruos y un jefe final, uno por rango de resets. Se entra por el portal "Dungeon Entrance" (el del remolino), que está en Lorencia, Noria, Devias y Elbeland.</p>
<table><thead><tr><th>Dungeon</th><th>Resets</th><th>Jefe final</th></tr></thead><tbody><tr><td>Kanturu</td><td>0 a 5</td><td>Mutant Golem</td></tr><tr><td>Curse of Crywolf</td><td>6 a 10</td><td>Inferno Cerberus</td></tr><tr><td>Karutan Underground</td><td>11 a 15</td><td>Twisted Condra</td></tr><tr><td>Kardamahal</td><td>16 o más</td><td>Lava Demon</td></tr></tbody></table>
<ul><li>Cada personaje puede entrar 3 veces por día.</li><li>La run dura 20 minutos. Al matar al jefe, cada jugador recibe 350 Ruud (con 15 resets o más; cuenta para el límite de 3 eventos por día) y se abre el cofre de premios (jewels). El jefe además tira 5 joyas al azar (Chaos, Bless, Soul, Creation o Life) y, con 5% de chance, un Talisman of Chaos Assembly.</li><li>Cada dungeon tiene 3 dificultades: Normal, Hard y Master. Master solo la pueden elegir los personajes con clase master (3.ª clase). Cuanto más alta, más fuertes los monstruos y mejores los premios.</li></ul>`,
            `<p>Dungeons are runs for up to 5 players with waves of monsters and a final boss, one per reset range. You enter through the "Dungeon Entrance" portal (the swirl one), found in Lorencia, Noria, Devias and Elbeland.</p>
<table><thead><tr><th>Dungeon</th><th>Resets</th><th>Final boss</th></tr></thead><tbody><tr><td>Kanturu</td><td>0 to 5</td><td>Mutant Golem</td></tr><tr><td>Curse of Crywolf</td><td>6 to 10</td><td>Inferno Cerberus</td></tr><tr><td>Karutan Underground</td><td>11 to 15</td><td>Twisted Condra</td></tr><tr><td>Kardamahal</td><td>16 or more</td><td>Lava Demon</td></tr></tbody></table>
<ul><li>Each character can enter 3 times per day.</li><li>The run lasts 20 minutes. When the boss dies, each player receives 350 Ruud (with 15 resets or more; it counts toward the limit of 3 events per day) and the reward chest (jewels) opens. The boss also drops 5 random jewels (Chaos, Bless, Soul, Creation or Life) and, with a 5% chance, a Talisman of Chaos Assembly.</li><li>Each dungeon has 3 difficulties: Normal, Hard and Master. Only characters with a master class (3rd class) can pick Master. The higher it is, the stronger the monsters and the better the rewards.</li></ul>`,
            `<p>Os dungeons são percursos de até 5 jogadores com ondas de monstros e um chefe final, um por faixa de resets. Entra-se pelo portal "Dungeon Entrance" (o do redemoinho), que fica em Lorencia, Noria, Devias e Elbeland.</p>
<table><thead><tr><th>Dungeon</th><th>Resets</th><th>Chefe final</th></tr></thead><tbody><tr><td>Kanturu</td><td>0 a 5</td><td>Mutant Golem</td></tr><tr><td>Curse of Crywolf</td><td>6 a 10</td><td>Inferno Cerberus</td></tr><tr><td>Karutan Underground</td><td>11 a 15</td><td>Twisted Condra</td></tr><tr><td>Kardamahal</td><td>16 ou mais</td><td>Lava Demon</td></tr></tbody></table>
<ul><li>Cada personagem pode entrar 3 vezes por dia.</li><li>A run dura 20 minutos. Ao matar o chefe, cada jogador recebe 350 Ruud (com 15 resets ou mais; conta para o limite de 3 eventos por dia) e o baú de prêmios (jewels) se abre. O chefe também solta 5 joias aleatórias (Chaos, Bless, Soul, Creation ou Life) e, com 5% de chance, um Talisman of Chaos Assembly.</li><li>Cada dungeon tem 3 dificuldades: Normal, Hard e Master. Master só pode ser escolhida por personagens com classe master (3.ª classe). Quanto mais alta, mais fortes os monstros e melhores os prêmios.</li></ul>`,
          ),
        ),
      ],
    },
    {
      id: 'character',
      icon: 'FaShieldAlt',
      title: L('Personaje', 'Character', 'Personagem'),
      items: [
        item(
          'soul-system',
          L('Soul System', 'Soul System', 'Soul System'),
          L(
            `<p><strong>Tecla K.</strong> Ganás puntos de alma con cada reset y matando jefes, y los repartís en 16 elementos que suben tus stats de forma permanente.</p>`,
            `<p><strong>Key K.</strong> You earn soul points with every reset and by killing bosses, and you spread them across 16 elements that raise your stats permanently.</p>`,
            `<p><strong>Tecla K.</strong> Você ganha pontos de alma a cada reset e matando chefes, e os distribui em 16 elementos que aumentam seus stats de forma permanente.</p>`,
          ),
        ),
        item(
          'collection',
          L('Colección', 'Collection', 'Coleção'),
          L(
            `<p><strong>Tecla O.</strong> Entregás piezas excelentes desde el inventario para completar grupos de items. Cada grupo completo da un bonus permanente. Las piezas que entregás se consumen.</p>`,
            `<p><strong>Key O.</strong> You hand in excellent pieces from the inventory to complete item groups. Each completed group gives a permanent bonus. The pieces you hand in are consumed.</p>`,
            `<p><strong>Tecla O.</strong> Você entrega peças excelentes do inventário para completar grupos de itens. Cada grupo completo dá um bônus permanente. As peças entregues são consumidas.</p>`,
          ),
        ),
        item(
          'combat-quiver',
          L('Combat Quiver (Elf)', 'Combat Quiver (Elf)', 'Combat Quiver (Elf)'),
          L(
            `<p>El Combat Quiver es un carcaj para la Elf de agilidad: se equipa en la mano libre junto al arco o la ballesta y reemplaza a las flechas y a los bolts. Se ve en la espalda del personaje.</p>
<ul><li>Mientras lo tenés equipado no gastás flechas ni bolts y el MU Helper no recarga.</li><li>Su daño (111 a 137, más nivel y opciones) se suma al del arco; la velocidad de ataque queda en el promedio de los dos.</li><li>Pide 27 de fuerza y 98 de agilidad. Se gasta como un arma y se repara normal; si llega a 0 de durabilidad, volvés a necesitar flechas.</li><li>Lo vende Eo the Craftsman en Noria, junto a los arcos iniciales. También puede caer de monstruos, normal o excelente.</li></ul>`,
            `<p>The Combat Quiver is a quiver for the agility Elf: it is equipped in the free hand next to the bow or crossbow and replaces arrows and bolts. It shows on the character's back.</p>
<ul><li>While you have it equipped you don't spend arrows or bolts and the MU Helper doesn't reload.</li><li>Its damage (111 to 137, plus level and options) adds to the bow's; attack speed ends up as the average of the two.</li><li>It requires 27 strength and 98 agility. It wears down like a weapon and is repaired normally; if it reaches 0 durability, you need arrows again.</li><li>It's sold by Eo the Craftsman in Noria, next to the starter bows. It can also drop from monsters, normal or excellent.</li></ul>`,
            `<p>O Combat Quiver é uma aljava para a Elf de agilidade: equipa-se na mão livre junto com o arco ou a besta e substitui as flechas e os bolts. Aparece nas costas do personagem.</p>
<ul><li>Enquanto estiver equipado você não gasta flechas nem bolts e o MU Helper não recarrega.</li><li>O dano dele (111 a 137, mais nível e opções) soma ao do arco; a velocidade de ataque fica na média dos dois.</li><li>Pede 27 de força e 98 de agilidade. Desgasta como uma arma e se repara normalmente; se chegar a 0 de durabilidade, você volta a precisar de flechas.</li><li>É vendido pelo Eo the Craftsman em Noria, junto com os arcos iniciais. Também pode cair de monstros, normal ou excelente.</li></ul>`,
          ),
        ),
        item(
          'skills-levels',
          L('Skills: niveles y cristales', 'Skills: levels and crystals', 'Skills: níveis e cristais'),
          L(
            `<p>Los requisitos de nivel de las skills siguen las guías de Season 6. Los scrolls y orbes sin nivel solo piden sus stats (energía, comando, etc.). Las que sí piden nivel:</p>
<table><thead><tr><th>Skill</th><th>Nivel</th></tr></thead><tbody><tr><td>Impale</td><td>28</td></tr><tr><td>Twisting Slash, Fire Slash</td><td>80</td></tr><tr><td>Fire Breath</td><td>110</td></tr><tr><td>Swell Life</td><td>120</td></tr><tr><td>Penetration</td><td>130</td></tr><tr><td>Death Stab</td><td>160</td></tr><tr><td>Rageful Blow</td><td>170</td></tr><tr><td>Strike of Destruction, Multi-Shot, Recovery, Infinity Arrow, Flame Strike, Gigantic Storm, Chaotic Diseier</td><td>220</td></tr><tr><td>Rage Fighter: Increase Health, Increase Block</td><td>50</td></tr><tr><td>Rage Fighter: Chain Drive, Dark Side, Dragon Roar, Dragon Slasher, Ignore Defense</td><td>150</td></tr></tbody></table>
<p><strong>Quest de Marlon (Hero Status).</strong> Para aprender Multi-Shot, Flame Strike y Chaotic Diseier (con su cristal o scroll) hace falta haber completado la quest de nivel 220 de Marlon. Una vez aprendidas, se usan sin la quest.</p>`,
            `<p>Skill level requirements follow the Season 6 guides. Scrolls and orbs without a level only require their stats (energy, command, etc.). The ones that do require a level:</p>
<table><thead><tr><th>Skill</th><th>Level</th></tr></thead><tbody><tr><td>Impale</td><td>28</td></tr><tr><td>Twisting Slash, Fire Slash</td><td>80</td></tr><tr><td>Fire Breath</td><td>110</td></tr><tr><td>Swell Life</td><td>120</td></tr><tr><td>Penetration</td><td>130</td></tr><tr><td>Death Stab</td><td>160</td></tr><tr><td>Rageful Blow</td><td>170</td></tr><tr><td>Strike of Destruction, Multi-Shot, Recovery, Infinity Arrow, Flame Strike, Gigantic Storm, Chaotic Diseier</td><td>220</td></tr><tr><td>Rage Fighter: Increase Health, Increase Block</td><td>50</td></tr><tr><td>Rage Fighter: Chain Drive, Dark Side, Dragon Roar, Dragon Slasher, Ignore Defense</td><td>150</td></tr></tbody></table>
<p><strong>Marlon's quest (Hero Status).</strong> To learn Multi-Shot, Flame Strike and Chaotic Diseier (with their crystal or scroll) you must have completed Marlon's level 220 quest. Once learned, you use them without the quest.</p>`,
            `<p>Os requisitos de nível das skills seguem os guias do Season 6. Os scrolls e orbs sem nível só pedem seus stats (energia, comando, etc.). As que pedem nível:</p>
<table><thead><tr><th>Skill</th><th>Nível</th></tr></thead><tbody><tr><td>Impale</td><td>28</td></tr><tr><td>Twisting Slash, Fire Slash</td><td>80</td></tr><tr><td>Fire Breath</td><td>110</td></tr><tr><td>Swell Life</td><td>120</td></tr><tr><td>Penetration</td><td>130</td></tr><tr><td>Death Stab</td><td>160</td></tr><tr><td>Rageful Blow</td><td>170</td></tr><tr><td>Strike of Destruction, Multi-Shot, Recovery, Infinity Arrow, Flame Strike, Gigantic Storm, Chaotic Diseier</td><td>220</td></tr><tr><td>Rage Fighter: Increase Health, Increase Block</td><td>50</td></tr><tr><td>Rage Fighter: Chain Drive, Dark Side, Dragon Roar, Dragon Slasher, Ignore Defense</td><td>150</td></tr></tbody></table>
<p><strong>Quest do Marlon (Hero Status).</strong> Para aprender Multi-Shot, Flame Strike e Chaotic Diseier (com o cristal ou scroll deles) é preciso ter completado a quest de nível 220 do Marlon. Depois de aprendidas, são usadas sem a quest.</p>`,
          ),
        ),
        item(
          'auto-stats',
          L('Reparto automático de puntos', 'Automatic point distribution', 'Distribuição automática de pontos'),
          L(
            `<p><strong>/autostats.</strong> Elegís cómo repartir los puntos al subir de nivel, por ejemplo /autostats 40 30 30 0 0 (fuerza, agilidad, vitalidad, energía, comando). /autostats off lo apaga.</p>`,
            `<p><strong>/autostats.</strong> You choose how to distribute points when you level up, for example /autostats 40 30 30 0 0 (strength, agility, vitality, energy, command). /autostats off turns it off.</p>`,
            `<p><strong>/autostats.</strong> Você escolhe como distribuir os pontos ao subir de nível, por exemplo /autostats 40 30 30 0 0 (força, agilidade, vitalidade, energia, comando). /autostats off desliga.</p>`,
          ),
        ),
      ],
    },
    {
      id: 'community',
      icon: 'FaUsers',
      title: L('Comunidad y eventos', 'Community and events', 'Comunidade e eventos'),
      items: [
        item(
          'party',
          L('Party', 'Party', 'Party'),
          L(
            `<ul><li>Buscar party (tecla N): publicar tu party o sumarte a una de la lista.</li><li>Configuración de party (Numpad 1): nivel máximo, contraseña y filtros de guild, alianza y clase.</li><li>Ctrl+A: la party te sigue (aunque estén en otro mapa, van al portal más cercano a vos).</li><li>Ctrl+S: arranca el MU Helper de toda la party.</li></ul>
<p>Las teclas del Numpad funcionan con la interfaz Breda, que es la que viene por defecto.</p>`,
            `<ul><li>Party search (key N): post your party or join one from the list.</li><li>Party settings (Numpad 1): maximum level, password and filters by guild, alliance and class.</li><li>Ctrl+A: the party follows you (even if you're on another map, they go to the portal closest to you).</li><li>Ctrl+S: starts the MU Helper for the whole party.</li></ul>
<p>Numpad keys work with the Breda interface, which is the default one.</p>`,
            `<ul><li>Buscar party (tecla N): publicar sua party ou entrar em uma da lista.</li><li>Configuração de party (Numpad 1): nível máximo, senha e filtros de guild, aliança e classe.</li><li>Ctrl+A: a party te segue (mesmo estando em outro mapa, vão para o portal mais próximo de você).</li><li>Ctrl+S: inicia o MU Helper de toda a party.</li></ul>
<p>As teclas do Numpad funcionam com a interface Breda, que é a que vem por padrão.</p>`,
          ),
        ),
        item(
          'events',
          L('Eventos', 'Events', 'Eventos'),
          L(
            `<p>Numpad 4 abre la lista de eventos (próximo inicio, jugadores adentro y cupo) y Numpad 5 la cuenta regresiva al próximo.</p>`,
            `<p>Numpad 4 opens the event list (next start, players inside and capacity) and Numpad 5 opens the countdown to the next one.</p>`,
            `<p>Numpad 4 abre a lista de eventos (próximo início, jogadores dentro e vagas) e Numpad 5 a contagem regressiva para o próximo.</p>`,
          ),
        ),
        item(
          'daily-reward',
          L('Recompensa diaria', 'Daily reward', 'Recompensa diária'),
          L(
            `<p><strong>Tecla Y o /daily claim.</strong> Un calendario de 28 días: cada día del server podés reclamar el premio del día siguiente. Al entrar al juego te avisa si tenés uno disponible.</p>`,
            `<p><strong>Key Y or /daily claim.</strong> A 28-day calendar: each server day you can claim the next day's prize. When you enter the game it tells you if you have one available.</p>`,
            `<p><strong>Tecla Y ou /daily claim.</strong> Um calendário de 28 dias: a cada dia do server você pode resgatar o prêmio do dia seguinte. Ao entrar no jogo ele avisa se você tem um disponível.</p>`,
          ),
        ),
        item(
          'death-log',
          L('Registro de muertes', 'Death log', 'Registro de mortes'),
          L(
            `<p><strong>Numpad 3.</strong> Tus últimas muertes: quién te mató, dónde y cuándo.</p>`,
            `<p><strong>Numpad 3.</strong> Your latest deaths: who killed you, where and when.</p>`,
            `<p><strong>Numpad 3.</strong> Suas últimas mortes: quem te matou, onde e quando.</p>`,
          ),
        ),
        item(
          'jewel-bank',
          L('Banco de joyas', 'Jewel bank', 'Banco de joias'),
          L(
            `<p><strong>Numpad 2.</strong> Guardás y sacás jewels (Bless, Soul, Chaos, Life, Creation, Guardian, Harmony y piedras de refinado) sin que ocupen lugar en el inventario. Se puede activar el depósito automático de lo que levantás.</p>`,
            `<p><strong>Numpad 2.</strong> You store and withdraw jewels (Bless, Soul, Chaos, Life, Creation, Guardian, Harmony and refining stones) without them taking up inventory space. You can turn on automatic deposit of what you pick up.</p>`,
            `<p><strong>Numpad 2.</strong> Você guarda e retira jewels (Bless, Soul, Chaos, Life, Creation, Guardian, Harmony e pedras de refinamento) sem ocupar espaço no inventário. Dá para ativar o depósito automático do que você pega.</p>`,
          ),
        ),
      ],
    },
    {
      id: 'game-client',
      icon: 'FaCog',
      title: L('Juego y cliente', 'Game and client', 'Jogo e cliente'),
      items: [
        item(
          'day-night',
          L('Día y noche', 'Day and night', 'Dia e noite'),
          L(
            `<p>El juego tiene un ciclo de día y noche que es el mismo para todos los jugadores: un día completo del juego dura 2 horas reales. El reloj de arriba de la pantalla muestra si es de día o de noche.</p>`,
            `<p>The game has a day and night cycle that is the same for all players: a full game day lasts 2 real hours. The clock at the top of the screen shows whether it is day or night.</p>`,
            `<p>O jogo tem um ciclo de dia e noite que é o mesmo para todos os jogadores: um dia completo do jogo dura 2 horas reais. O relógio no topo da tela mostra se é dia ou noite.</p>`,
          ),
        ),
        item(
          'client-launcher',
          L('Cliente, launcher y versiones', 'Client, launcher and versions', 'Cliente, launcher e versões'),
          L(
            `<ul><li>El juego se actualiza con el launcher (Mu Breda Launcher.exe, al lado de Main.exe): al abrirlo baja solo lo que cambió y borra lo que ya no se usa, aunque vengas de una versión vieja.</li><li>El server solo acepta la última versión del cliente. Si te sale "Se requiere la nueva versión del juego", abrí el launcher y dejalo actualizar.</li><li>Para jugar por primera vez, bajá el cliente completo desde la sección de descargas de la web (Mega, Drive o Mediafire); ya trae el launcher.</li><li>Si entrás con una cuenta que ya está conectada en otro lado, la otra sesión se cierra.</li><li>En Windows el juego usa DirectX 12 por defecto. Si querés probar Vulkan, en config.ini cambiá Backend=default por Backend=vulkan.</li></ul>`,
            `<ul><li>The game updates through the launcher (Mu Breda Launcher.exe, next to Main.exe): when you open it, it downloads only what changed and deletes what is no longer used, even if you come from an old version.</li><li>The server only accepts the latest client version. If you get "The new game version is required", open the launcher and let it update.</li><li>To play for the first time, download the full client from the downloads section of the website (Mega, Drive or Mediafire); it already includes the launcher.</li><li>If you log in with an account that is already connected elsewhere, the other session is closed.</li><li>On Windows the game uses DirectX 12 by default. If you want to try Vulkan, in config.ini change Backend=default to Backend=vulkan.</li></ul>`,
            `<ul><li>O jogo se atualiza com o launcher (Mu Breda Launcher.exe, ao lado do Main.exe): ao abri-lo ele baixa só o que mudou e apaga o que não é mais usado, mesmo que você venha de uma versão antiga.</li><li>O server só aceita a última versão do cliente. Se aparecer "É necessária a nova versão do jogo", abra o launcher e deixe atualizar.</li><li>Para jogar pela primeira vez, baixe o cliente completo na seção de downloads do site (Mega, Drive ou Mediafire); ele já traz o launcher.</li><li>Se você entrar com uma conta que já está conectada em outro lugar, a outra sessão é encerrada.</li><li>No Windows o jogo usa DirectX 12 por padrão. Se quiser testar Vulkan, no config.ini troque Backend=default por Backend=vulkan.</li></ul>`,
          ),
        ),
        item(
          'commands-keys',
          L('Comandos y teclas', 'Commands and keys', 'Comandos e teclas'),
          L(
            `<table><thead><tr><th>Tecla o comando</th><th>Qué hace</th></tr></thead><tbody><tr><td>F6</td><td>Menú principal (de ahí se abre el VIP)</td></tr><tr><td>/ruud</td><td>Muestra tu saldo de Ruud</td></tr><tr><td>/move Ruined_Lorencia</td><td>Te lleva a Ruined Lorencia (10.000 zen)</td></tr><tr><td>/autostats 40 30 30 0 0</td><td>Reparte los puntos solos al subir de nivel</td></tr><tr><td>/autostats off</td><td>Apaga el reparto automático</td></tr><tr><td>Y o /daily claim</td><td>Recompensa diaria</td></tr><tr><td>K</td><td>Soul System</td></tr><tr><td>O</td><td>Colección</td></tr><tr><td>N</td><td>Buscar party</td></tr><tr><td>Ctrl+A</td><td>La party te sigue</td></tr><tr><td>Ctrl+S</td><td>MU Helper de toda la party</td></tr><tr><td>Numpad 1</td><td>Configuración de party</td></tr><tr><td>Numpad 2</td><td>Banco de joyas</td></tr><tr><td>Numpad 3</td><td>Registro de muertes</td></tr><tr><td>Numpad 4</td><td>Lista de eventos</td></tr><tr><td>Numpad 5</td><td>Cuenta regresiva de eventos</td></tr></tbody></table>
<p>Las teclas del Numpad funcionan con la interfaz Breda, que es la que viene por defecto.</p>`,
            `<table><thead><tr><th>Key or command</th><th>What it does</th></tr></thead><tbody><tr><td>F6</td><td>Main menu (VIP opens from there)</td></tr><tr><td>/ruud</td><td>Shows your Ruud balance</td></tr><tr><td>/move Ruined_Lorencia</td><td>Takes you to Ruined Lorencia (10,000 zen)</td></tr><tr><td>/autostats 40 30 30 0 0</td><td>Distributes points automatically when you level up</td></tr><tr><td>/autostats off</td><td>Turns off automatic distribution</td></tr><tr><td>Y or /daily claim</td><td>Daily reward</td></tr><tr><td>K</td><td>Soul System</td></tr><tr><td>O</td><td>Collection</td></tr><tr><td>N</td><td>Party search</td></tr><tr><td>Ctrl+A</td><td>The party follows you</td></tr><tr><td>Ctrl+S</td><td>MU Helper for the whole party</td></tr><tr><td>Numpad 1</td><td>Party settings</td></tr><tr><td>Numpad 2</td><td>Jewel bank</td></tr><tr><td>Numpad 3</td><td>Death log</td></tr><tr><td>Numpad 4</td><td>Event list</td></tr><tr><td>Numpad 5</td><td>Event countdown</td></tr></tbody></table>
<p>Numpad keys work with the Breda interface, which is the default one.</p>`,
            `<table><thead><tr><th>Tecla ou comando</th><th>O que faz</th></tr></thead><tbody><tr><td>F6</td><td>Menu principal (dali se abre o VIP)</td></tr><tr><td>/ruud</td><td>Mostra seu saldo de Ruud</td></tr><tr><td>/move Ruined_Lorencia</td><td>Leva você a Ruined Lorencia (10.000 zen)</td></tr><tr><td>/autostats 40 30 30 0 0</td><td>Distribui os pontos sozinho ao subir de nível</td></tr><tr><td>/autostats off</td><td>Desliga a distribuição automática</td></tr><tr><td>Y ou /daily claim</td><td>Recompensa diária</td></tr><tr><td>K</td><td>Soul System</td></tr><tr><td>O</td><td>Coleção</td></tr><tr><td>N</td><td>Buscar party</td></tr><tr><td>Ctrl+A</td><td>A party te segue</td></tr><tr><td>Ctrl+S</td><td>MU Helper de toda a party</td></tr><tr><td>Numpad 1</td><td>Configuração de party</td></tr><tr><td>Numpad 2</td><td>Banco de joias</td></tr><tr><td>Numpad 3</td><td>Registro de mortes</td></tr><tr><td>Numpad 4</td><td>Lista de eventos</td></tr><tr><td>Numpad 5</td><td>Contagem regressiva de eventos</td></tr></tbody></table>
<p>As teclas do Numpad funcionam com a interface Breda, que é a que vem por padrão.</p>`,
          ),
        ),
      ],
    },
  ],
};

export function cloneGuidesDefaults() {
  return structuredClone(GUIDES_DEFAULTS);
}
