# UI/UX Audit

## Enfoque
Este documento parte de una revisión del código actual y de los patrones que hoy existen en la app, no de una reinvención total. La idea es detectar fricciones reales, ordenar prioridades y dejar una guía clara para mejorar UX/UI sin romper la lógica operativa del backoffice.

La auditoría se apoya en la inspección de:
- layout global, sidebar, topbar y navegación por rol
- dashboard
- imports y review de imports
- deals y detalle de deal
- dead deals y detalle
- expenses y detalle
- settlements y detalle de corrida
- masters: dealers, partners, financiers
- audit
- settings
- componentes compartidos: tablas, formularios, badges, empty state

## 1. Diagnóstico General De La Experiencia Actual
La app tiene una base funcional bastante clara: paneles consistentes, estructura de backoffice entendible, navegación lateral simple y un sistema visual sobrio que transmite “herramienta interna”. Eso es bueno y conviene preservarlo.

Hoy la experiencia está más cerca de un producto “operativo y usable” que de una interfaz “madura y guiada”. El sistema deja hacer muchas cosas, pero rara vez ayuda a priorizar, entender contexto, anticipar consecuencias o leer información densa con rapidez.

Fortalezas actuales:
- La estructura general por módulos es lógica.
- Hay una base visual compartida con variables, paneles, tablas y botones reutilizables.
- Los formularios y tablas siguen patrones relativamente previsibles.
- Los empty states y badges ya existen, aunque todavía son básicos.

Problemas transversales:
- La jerarquía visual es débil: muchas pantallas empiezan casi igual y cuesta identificar qué es primario.
- El producto es claramente desktop-first y no está preparado para viewport más chicos (`body` con `min-width: 1280px`).
- La navegación es funcional pero poco orientadora: no hay breadcrumbs, contexto de ubicación, ni agrupación semántica.
- Las tablas cargan mucha información con poca ayuda para escanear rápido.
- Los formularios funcionan, pero son largos, poco guiados y con feedback de validación muy mínimo.
- Los mensajes de éxito/error/loading están presentes pero no forman todavía un sistema consistente.

## 2. Problemas De UX Detectados Por Módulo/Pantalla

### Navegación Y Shell
- El sidebar lista módulos, pero no agrupa por áreas operativas.
- El topbar es demasiado genérico (`Authenticated workspace`) y no aporta contexto real.
- No hay breadcrumbs ni título contextual persistente por pantalla.
- La navegación por rol filtra opciones, pero no explica por qué ciertas áreas no existen para ciertos perfiles.

### Dashboard
- El dashboard perdió el header y hoy arranca directo con filtros, lo que reduce contexto.
- Hay muchas cards y tablas, pero no queda claro qué mirar primero.
- Las quick actions existen, pero no siempre están suficientemente destacadas frente a los bloques analíticos.
- Para `expense_admin`, la pantalla se siente más como placeholder que como home útil.

### Imports
- El wizard tiene buena intención pedagógica, pero la introducción es demasiado larga.
- El paso de carga no ayuda a prevenir errores antes de subir archivo.
- La review table es muy poderosa, pero cognitivamente pesada.
- Aprobar, rechazar, consolidar y editar compiten en el mismo plano visual.
- El flujo de selección masiva y consolidación puede generar ansiedad si no queda claro qué impacto tendrá.

### Deals
- La página mezcla filtro, alta manual y tabla en una misma vista larga.
- La tabla de deals tiene mucha densidad numérica y poco apoyo visual.
- La paginación es básica y no informa bien el total, rango visible o estado del filtro.
- El detalle del deal depende mucho de texto y botones utilitarios, con poca jerarquía.

### Expenses
- El módulo combina listado, filtros, alta, categorías y templates en una sola pantalla, lo que aumenta la carga cognitiva.
- El formulario tiene muchos estados dependientes de `scopeType`, pero la UI no los explica progresivamente.
- La selección de dealers para `selected_dealers` puede crecer mucho y volverse difícil de usar.
- El detalle de expense no destaca claramente la relación entre gasto, allocation y adjunto.

### Dead Deals
- El flujo es correcto pero muy parecido al de deals/expenses, sin identidad operativa propia.
- El valor de negocio de “dead deal” no se entiende rápido para un usuario nuevo.
- La tabla es útil, pero no resalta excepciones, importes altos o registros recientes.

### Settlements
- La pantalla principal mezcla creación de corrida, resumen actual, histórico y resultados en el mismo plano.
- La acción “Run monthly calculation” es importante, pero no tiene suficiente contención visual ni advertencia operacional.
- El historial de runs es informativo, pero no ayuda a comparar versiones o detectar la vigente con rapidez.
- La vista de detalle muestra resultados y errores, pero la jerarquía entre resumen, errores y payouts podría ser mejor.

### Masters: Dealers / Partners / Financiers
- Son pantallas útiles pero muy “CRUD puro”.
- Dealer shares y assignments tienen complejidad de negocio, pero la interfaz no guía demasiado.
- Las alertas existen, pero quedan visualmente mezcladas con el resto.
- Faltan más pistas sobre impacto histórico, vigencia, relaciones activas o consecuencias de archivar.

### Audit
- La pantalla cumple, pero está orientada a usuarios muy técnicos.
- El payload JSON es difícil de leer para seguimiento rápido.
- La tabla no prioriza eventos importantes ni ofrece resumidos legibles de cambios.

### Settings
- La pantalla está bien planteada, pero concentra demasiadas acciones por fila.
- El estado de usuario, rol, asignación y actividad compiten entre sí.
- La edición de usuario no guía bien el caso crítico de `partner_viewer` sin partner asignado.

## 3. Problemas De UI Detectados Por Consistencia Visual
- Se usan bien `panel`, `stat-card` y `hero-card`, pero no siempre queda claro cuándo corresponde cada uno.
- La app depende mucho de inline styles (`marginTop`, `marginBottom`, tamaños puntuales), lo que debilita consistencia futura.
- Tipografía correcta pero poco expresiva: casi todo cae en un mismo tono visual.
- Los botones `action-button`, `ghost-button` y `secondary-button` están cerca entre sí, pero sin una semántica visual totalmente cerrada.
- Los `StatusPill` ayudan, aunque todavía son demasiado genéricos para tantos dominios distintos.
- Las tablas `dashboard-table`, `masters-table` e `imports-table` conviven con pequeñas diferencias, pero sin un sistema único robusto.
- Los formularios comparten `field`, aunque faltan estados claros de foco, error, ayuda y deshabilitado.
- Los empty states son funcionales, pero muy sobrios y sin CTA más potente.
- El sistema de color está ordenado, pero todavía no diferencia lo suficiente entre información, alerta operacional, error crítico y éxito confirmado.

## 4. Mejores Prioridades Por Área

### Navegación
Prioridad alta.
- Reintroducir contexto de pantalla sin volver al header grande anterior.
- Agrupar navegación lateral por bloques: overview, operations, masters, admin.
- Agregar breadcrumbs o al menos una línea contextual simple en el topbar.
- Mostrar mejor el rol actual y qué capacidades tiene ese rol.

### Dashboard
Prioridad alta.
- Ordenar el dashboard según “qué hacer ahora” y “qué mirar después”.
- Destacar quick actions y métricas críticas arriba.
- Reducir ruido en cards secundarias.
- Dar una home más útil a `expense_admin`.

### Tablas
Prioridad alta.
- Unificar comportamiento, espaciado y acciones.
- Mejorar escaneabilidad con columnas prioritarias y datos secundarios en muted text.
- Alinear mejor números, porcentajes y montos.
- Diferenciar acciones primarias de acciones destructivas o secundarias.

### Filtros
Prioridad alta.
- Unificar layout y semántica de filtros entre módulos.
- Mostrar filtros activos de forma explícita.
- Agregar reset consistente en todos los listados.
- Evitar inputs inconsistentes, por ejemplo `type="date"` para “Period month” en deals.

### Formularios
Prioridad alta.
- Mejorar agrupación de campos.
- Agregar ayudas cortas donde hay lógica de negocio importante.
- Hacer más visible el feedback de error por campo o por bloque.
- Marcar claramente estados edit/create/read-only.

### Badges / Estados
Prioridad media-alta.
- Definir un vocabulario estable de tonos y etiquetas.
- Separar estados de workflow, validación, riesgo y datos derivados.
- Evitar que todo termine resolviéndose con `success / warning / muted`.

### Feedback De Errores Y Éxito
Prioridad alta.
- Crear un patrón consistente de alertas inline.
- Distinguir mejor error recuperable, bloqueo y confirmación exitosa.
- Evitar que los mensajes queden perdidos al pie de formularios largos.

### Loading / Empty States
Prioridad media-alta.
- Hoy no aparecen `loading.tsx`, `error.tsx` o `not-found.tsx` en `src/app`.
- Falta feedback de carga a nivel pantalla, tabla y acción.
- Los empty states necesitan CTA más claros y más contexto.

### Jerarquía Visual
Prioridad alta.
- Definir encabezado compacto por pantalla.
- Reordenar acciones, filtros, summary blocks y contenido primario.
- Limitar la sensación de “todo tiene el mismo peso”.

## 5. Propuestas Concretas Por Pantalla

### Dashboard
- Agregar encabezado compacto con nombre de pantalla, resumen corto y contexto de rol.
- Mantener filtros arriba, pero separarlos visualmente del contenido analítico.
- Orden sugerido: quick actions, métricas clave, tendencia/comparación, tablas secundarias.
- Para `expense_admin`, convertir la home en un launchpad real de tareas frecuentes.

### Imports
- Dividir visualmente el wizard en “preparar archivo”, “subir”, “resultado”.
- Reducir longitud del texto introductorio.
- Hacer más fuerte la confirmación post-upload con CTA principal a review.
- En review, separar barra de acciones masivas de los filtros.
- Resaltar cantidad de filas visibles, seleccionadas, aprobables y consolidadas.
- Agrupar mejor acciones por fila: ver/editar, decisión, navegación.

### Deals
- Separar visualmente “alta manual” del listado principal, con opción de colapsar.
- Cambiar “Period month” a `month` en el filtro para consistencia.
- Hacer más legible la tabla con prioridad en dealer, VIN, profit y estado de edición.
- Mejorar paginación con resumen tipo “mostrando X-Y de Z”.

### Expenses
- Reordenar la pantalla en: filtros/listado arriba, herramientas de administración abajo o en panel lateral.
- En el formulario, mostrar ayuda contextual según scope.
- Para `selected_dealers`, usar una selección más compacta y legible.
- En detalle, jerarquizar resumen del gasto, allocations y adjunto.

### Dead Deals
- Explicar mejor el concepto y el cálculo en la pantalla principal.
- Resaltar fórmula fija de comisión como información de negocio estable.
- Dar más contexto en tabla sobre impacto mensual o reciente.

### Settlements
- Encabezado compacto con mes seleccionado y estado de la corrida actual.
- Convertir `SettlementsControls` en bloque claramente “primary action”.
- Resaltar la corrida vigente en el historial.
- En detalle, poner errores y payout management con más prioridad cuando existan.

### Dealers / Partners / Financiers
- Mantener estructura dual listado + editor, porque funciona.
- Reforzar visualmente cuándo se está editando vs creando.
- Hacer más visibles alertas importantes de shares y vigencia.
- Mejorar legibilidad de acciones destructivas.

### Audit
- Mostrar una versión resumida del cambio antes del JSON completo.
- Destacar eventos críticos por tono o badge.
- Dar una vista más “audit trail” y menos “tabla de payloads”.

### Settings
- Separar acciones por criticidad: editar, reset, activar/desactivar.
- Destacar claramente casos incompletos de partner assignment.
- Hacer más contextual el formulario lateral con ayudas según rol.

## 6. Quick Wins De Bajo Esfuerzo
- Reintroducir un encabezado compacto y consistente por pantalla, más chico que el `PageHeader` original.
- Unificar todos los filtros con mismo layout, botones `Apply` y `Reset`, y labels equivalentes.
- Cambiar campos inconsistentes de fecha/mes para que usen el tipo correcto.
- Mejorar spacing vertical entre filtros, tablas y formularios.
- Hacer que montos y porcentajes se alineen mejor en tablas.
- Dar más contraste a acciones primarias vs secundarias.
- Convertir mensajes de error/éxito en bloques inline consistentes.
- Mejorar textos de empty state con CTA real cuando aplique.
- Destacar mejor la fila o tarjeta “current version” en settlements.
- Afinar el topbar para que muestre contexto real de módulo.

## 7. Mejoras De Mediano Impacto
- Crear un `PageSectionHeader` compacto reutilizable para pantallas y bloques grandes.
- Consolidar un sistema de tabla compartido con variantes en vez de tres estilos paralelos.
- Crear un sistema de alertas/notice reusable para success, warning, danger, info.
- Crear un patrón de filter bar compartido para todos los listados.
- Introducir skeleton/loading states por página y por tabla.
- Mejorar responsive progresivamente para viewport intermedios antes de ir a mobile total.
- Diseñar una navegación lateral agrupada y semántica.
- Replantear el dashboard como home operativa priorizada por rol.

## 8. Cosas Que NO Conviene Tocar Todavía
- No conviene cambiar radicalmente la paleta general: hoy funciona bien para una herramienta interna.
- No conviene reemplazar todo el sistema visual de paneles/tablas de una sola vez.
- No conviene introducir animaciones complejas ahora.
- No conviene rehacer completamente la arquitectura de layout antes de cerrar criterios visuales.
- No conviene mezclar esta etapa con grandes cambios de información o lógica de negocio.
- No conviene intentar resolver mobile full mientras todavía falta ordenar desktop.

## 9. Sistema De Criterios Visuales Para Mantener Consistencia Futura

### Principios
- Priorizar claridad operativa sobre decoración.
- Mantener el tono de backoffice premium y sobrio que ya existe.
- Toda pantalla debe responder rápido: dónde estoy, qué puedo hacer, qué es importante.
- Cada vista debe tener una acción principal clara.

### Encabezados
- Usar encabezado compacto, no hero grande, salvo flujos excepcionales.
- Siempre incluir nombre de pantalla y una línea breve de contexto si agrega valor.
- El topbar debe complementar, no duplicar.

### Layout
- Mantener paneles como unidad base.
- Separar claramente resumen, filtros, contenido principal y acciones secundarias.
- Evitar que más de un bloque compita como protagonista arriba del fold.

### Tablas
- Definir columnas primarias, secundarias y acciones.
- Datos secundarios siempre en texto muted y tamaño menor.
- Acciones destructivas nunca deben verse equivalentes a la primaria.
- Vacíos de tabla deben usar empty state, no solo una fila sin datos.

### Formularios
- Agrupar por intención, no solo por cantidad de campos.
- Ayudas breves para reglas de negocio importantes.
- Error visible cerca del problema y resumen general si el formulario es largo.
- Diferenciar create, edit y read-only con cambios visibles en título y CTA.

### Estados
- Definir tonos por propósito:
- `success`: confirmado/completado.
- `warning`: requiere atención o validación.
- `danger`: bloqueo, error o acción destructiva.
- `muted`: estado neutro o informativo.
- Evitar usar la misma apariencia para workflow, validación y acceso.

### Feedback
- Toda acción importante debe devolver feedback claro.
- Confirmaciones de éxito deben verse como confirmación, no como texto suelto.
- Errores críticos deben aparecer en bloque destacado y con próxima acción sugerida.

### Responsive
- Antes de buscar mobile completo, asegurar buena experiencia en laptop mediana.
- Eliminar dependencias rígidas como `min-width: 1280px` en etapas posteriores.

## Helpers / Componentes / Cambios Estructurales Que Valdría Evaluar Antes De Implementar
Estos cambios parecen convenientes, pero conviene validarlos antes de tocar código:
- `PageSectionHeader` compacto para pantallas y secciones.
- `FilterBar` compartido para listados.
- `InlineNotice` o `Alert` con variantes semánticas.
- `TableShell` unificado con header, count, empty state y footer/paginación.
- `MetricCard` con variantes más explícitas para KPI primario vs secundario.
- `ContextTopbar` o mejora del topbar actual para mostrar módulo, ruta o breadcrumbs.
- Reorganización semántica del sidebar por grupos.

## Orden Sugerido De Implementación Posterior
1. Definir criterios visuales y componentes base.
2. Resolver navegación, topbar y encabezado compacto.
3. Unificar filtros y feedback.
4. Mejorar tablas y jerarquía de acciones.
5. Reordenar dashboard.
6. Refinar formularios complejos: imports, expenses, settlements.

## Resumen Ejecutivo
La app ya tiene una base bastante usable y una identidad visual coherente para backoffice. El principal problema no es “falta de diseño”, sino falta de jerarquía, guía y consistencia operativa entre módulos. El mejor siguiente paso no es rehacer todo, sino consolidar un sistema liviano de navegación, encabezados, filtros, tablas, formularios y feedback para que después cualquier mejora visual grande tenga una base estable.
