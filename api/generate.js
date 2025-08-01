const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();

// Aumentar el límite del tamaño del cuerpo de la solicitud a 30mb para manejar los PDF
app.use(express.json({ limit: '30mb' }));

app.post('/api/generate', async (req, res) => {
    try {
        // Inicializa el cliente de la IA Generativa con la API Key desde las variables de entorno
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const { prompt, questionnaireData, pdfBase64, userName } = req.body;

        if (!pdfBase64) {
            return res.status(400).json({ error: "No PDF file data provided." });
        }

        const parts = [
            { text: prompt },
            { text: questionnaireData },
            {
                inlineData: {
                    mimeType: "application/pdf",
                    data: pdfBase64,
                },
            },
            { text: `
                **REGLA DE ORO: NO escribas NINGÚN texto introductorio, saludo o explicación antes del código HTML. Tu respuesta DEBE comenzar DIRECTAMENTE con la etiqueta \`<header>\`. Cualquier texto fuera del código HTML resultará en un error.**

                **Misión Crítica:** Genera el CÓDGIO HTML COMPLETO para el panel de resultados. El HTML debe incluir un <header>, un <main> y un <footer>. El diseño debe tener una barra de navegación superior fija y un contenido principal bien estructurado con tarjetas e iconos. El nombre del usuario es: "${userName}". Usa este nombre en el panel.

                **Análisis y Contenido Requerido - PRESTA MUCHA ATENCIÓN:**
                
                1.  **Estilo para "Acciones Concretas":** Es **VITAL** que CADA VEZ que generes un título "**Acciones Concretas:**" y su lista de recomendaciones, los envuelvas en un \`<div class="bg-orange-100 text-blue-800 p-4 rounded-lg mt-4 print-highlight print-break-avoid">\`. El título "**Acciones Concretas:**" debe tener la clase \`font-semibold\`. Todo el texto dentro de este div debe tener la clase \`print-highlight-text\`.
                2.  **Extracción de Datos Clave:** Del reporte, extrae y destaca específicamente los hallazgos negativos como: baja producción de SCFA/Butirato, desbalance en el ratio Firmicutes/Bacteroidetes, niveles elevados de Proteobacterias, y cualquier predisposición a constipación o inflamación. Estos deben ser puntos centrales en las recomendaciones.

                **Estructura del Reporte de Salida (HTML):**

                1.  **Header Fijo:** Un \`<header class="bg-white shadow-md sticky top-0 z-50 no-print">\` que contenga un \`<h1>\` "Tu Panel de Bienestar, ${userName}", una barra de navegación con enlaces a las 5 secciones, y dos botones: "Exportar a PDF" \`<button id="print-button" ...>\` y "Reiniciar" \`<button id="reset-button" ...>\`.
                2.  **Contenido Principal (<main>):**
                    * **Sección 1 (id="seccion1"): Puntos de Atención Clave:** * **REGLA CRÍTICA:** Para esta sección, debes basar las sugerencias **FUNDAMENTALMENTE en los hallazgos más importantes del reporte PDF (genética y microbioma)**, no en el cuestionario. El objetivo es resaltar los datos científicos más relevantes.
                        * **REGLA CRÍTICA:** Cada una de las tres tarjetas debe contener un **MÁXIMO de 5 puntos**. Sé conciso y prioriza el mayor impacto.
                        * **REGLA DE DISEÑO (CON ICONOS):**
                            * La tarjeta "Tus Fortalezas" debe tener un fondo verde claro (\`bg-emerald-50\`). El título debe ser: \`<h3 class="flex items-center text-lg font-semibold text-emerald-800"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7 mr-2"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>Tus Fortalezas</h3>\`.
                            * La tarjeta "Tus Áreas de Atención" debe tener un fondo naranja claro (\`bg-orange-50\`). El título debe ser: \`<h3 class="flex items-center text-lg font-semibold text-orange-800"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7 mr-2"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>Tus Áreas de Atención</h3>\`.
                            * La tarjeta "Tus Puntos de Acción Prioritarios" debe tener un fondo rojo claro (\`bg-red-50\`). El título debe ser: \`<h3 class="flex items-center text-lg font-semibold text-red-800"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7 mr-2"><path d="M12 2.25a.75.75 0 01.75.75v.511c1.184.213 2.22.758 3.096 1.539a.75.75 0 01-1.04 1.082c-.672-.647-1.507-1.012-2.435-1.082a.75.75 0 01-.371-.97zM6.904 6.33a.75.75 0 011.04-1.082c.876.78 1.912 1.325 3.096 1.539V7.25a.75.75 0 011.5 0v.511c1.184.213 2.22.758 3.096 1.539a.75.75 0 01-1.04 1.082c-.672-.647-1.507-1.012-2.435-1.082a.75.75 0 01-.371-.971l-.001-.003-.002-.005A5.25 5.25 0 0010 5.25c-.832 0-1.612.196-2.324.551a.75.75 0 01-.732-1.22l.004-.002z" /><path fill-rule="evenodd" d="M12 1.5a.75.75 0 00-7.5 7.5c0 2.133.823 4.09 2.186 5.575l.414.441-.002.002.002.002.001.001a5.235 5.235 0 002.264 1.433.75.75 0 00.93-.134l.003-.004.002-.002.001-.001a.75.75 0 00.135-.93 3.73 3.73 0 01-1.603-1.015l-.415-.442A6 6 0 016 9c0-3.314 2.686-6 6-6s6 2.686 6 6c0 1.57-.604 3.005-1.595 4.061l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06A7.501 7.501 0 0019.5 9a.75.75 0 00-1.5 0 6 6 0 01-6 6 .75.75 0 000 1.5 7.5 7.5 0 007.5-7.5c0-4.142-3.358-7.5-7.5-7.5z" clip-rule="evenodd" /></svg>Tus Puntos de Acción Prioritarios</h3>\`.
                                * Cada tarjeta debe tener la clase \`print-break-avoid\`.
                            * **Sección 2 (id="seccion2"): Tu Estado Vitamínico (Genética + Microbioma):** El título debe ser un \`<h2>\` con las clases \`flex items-center text-2xl font-bold text-slate-800 mb-6\` y debe incluir este SVG: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 mr-3 text-blue-600"><path fill-rule="evenodd" d="M10.5 3.75a.75.75 0 00-1.5 0v.943l-2.223 3.705A3.375 3.375 0 006 12.223V18a.75.75 0 00.75.75h10.5A.75.75 0 0018 18v-5.777a3.375 3.375 0 00-.777-2.225L15 4.693V3.75a.75.75 0 00-1.5 0v.943l-2.223 3.705A3.375 3.375 0 009 12.223V18h2.25v-5.777a3.375 3.375 0 00-.777-2.225L8.25 6.295V3.75zM9 19.5a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9z" clip-rule="evenodd" /></svg>Tu Estado Vitamínico\`. Esta sección es CRÍTICA y **DEBE ESTAR SIEMPRE PRESENTE**. Debe tener un grid de tarjetas (2 o 3 columnas). Cada tarjeta representa una vitamina en estado de atención o prioritario. La tarjeta debe detallar claramente: "**Hallazgo Genético:**", "**Hallazgo del Microbioma:**" (si aplica, si no, debes poner "No presenta deficiencias"), "**Información Adicional (Cuestionario):**" (ej. "Mencionaste no tomar suplementos de Vitamina D"), y la sección de "**Acciones Concretas:**" (que debe estar resaltada). Todas las tarjetas deben tener la clase \`print-break-avoid\`.
                            * **Sección 3 (id="seccion3"): Tu Estrategia de Nutrición y Plan Semanal:**
                                * **REGLA CRÍTICA:** Debes presentar **SIEMPRE** una tabla HTML completa con el título "Tu Plan Nutricional Semanal Educativo". Usa las clases de Tailwind \`w-full table-auto text-sm text-left\`.
                                * **REGLA CRÍTICA:** La tabla debe tener un encabezado (\`<thead>\`) con las columnas: **Día, Desayuno, Almuerzo, Snack, Cena, Beneficio Clave**.
                                * **REGLA CRÍTICA:** El cuerpo de la tabla (\`<tbody>\`) debe contener una fila (\`<tr>\`) para cada día de la semana, de Lunes a Domingo.
                                * **REGLA CRÍTICA:** La columna "Beneficio Clave" **DEBE** ser muy específica y educativa, vinculando directamente la comida con un hallazgo del reporte, ej: 'Aporta fibra para tus bacterias productoras de Butirato (detectadas como bajas) y es bajo en [alérgeno del cuestionario]'.
                                * La tabla debe estar dentro de un div con la clase \`overflow-x-auto\` para ser responsive en móviles.
                            * **Sección 4 (id="seccion4"): Bienestar, Deporte y Descanso:** El título debe ser un \`<h2>\` con las clases \`flex items-center text-2xl font-bold text-slate-800 mb-6\` y debe incluir este SVG: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 mr-3 text-blue-600"><path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clip-rule="evenodd" /></svg>Bienestar, Deporte y Descanso\`. **DEBE TENER un layout de 2 columnas en pantallas medianas y grandes (md:grid-cols-2)**.
                                * **Columna 1 "Tu Perfil de Entrenamiento":** Debe comenzar con **una oración clara que resuma las fortalezas y puntos de atención del usuario** (ej: "Tu genética te favorece en deportes de potencia, pero indica un mayor riesgo de lesiones musculares..."). Luego, presentar la tarjeta con las "**Acciones Concretas:**" resaltadas.
                                * **Columna 2 "Tu Perfil de Descanso":** Debe comenzar con **una oración clara que resuma las fortalezas y puntos de atención del usuario** (ej: "Si bien no presentas dificultad para conciliar el sueño, tu genética sugiere un sueño más liviano..."). Luego, presentar la tarjeta con las "**Acciones Concretas:**" resaltadas.
                                * Todas las tarjetas deben tener la clase \`print-break-avoid\`.
                            * **Sección 5 (id="seccion5"): Salud Preventiva y Microbioma:** El título debe ser un \`<h2>\` con las clases \`flex items-center text-2xl font-bold text-slate-800 mb-6\` y debe incluir este SVG: \`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 mr-3 text-blue-600"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.016h-.008v-.016z" /></svg>Salud Preventiva y Microbioma\`. **DEBE ESTAR SIEMPRE PRESENTE Y TENER un layout de 2 columnas en pantallas medianas y grandes (md:grid-cols-2)**.
                                * **Columna 1 "Salud Preventiva":** Resaltar claramente los riesgos genéticos a tener en cuenta (ej. Tiroiditis, etc.) y proveer "**Acciones Concretas:**" bien claras para la prevención.
                                * **Columna 2 "Claves de tu Microbioma":** Resaltar los hallazgos más importantes del microbioma (ej. Proteobacterias elevadas) y proveer "**Acciones Concretas:**" específicas para mejorar esos indicadores.
                                * Todas las tarjetas deben tener la clase \`print-break-avoid\`.
                        3. **Footer:** Un \`<footer class="web-footer text-center p-6 mt-12 bg-slate-100 text-xs text-slate-500 no-print">\` con el texto legal.

                        **Instrucciones Adicionales:**
                        * El output debe ser únicamente el código HTML desde la etiqueta \`<header>\` hasta el final de la etiqueta \`</footer>\`. No incluyas \`<html>\`, \`<head>\`, \`<body>\`, ni el script de inicialización.
                        * El idioma de todo el contenido debe ser Español.
                        * **CRÍTICO: No utilices gráficos de Chart.js ni la etiqueta <canvas>.**
            `}
        ];

        const result = await model.generateContent({ contents: [{ role: "user", parts }] });
        const response = await result.response;
        const text = response.text();

        res.status(200).send(text);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: "Failed to generate content from AI.", details: error.message });
    }
});

// Iniciar el servidor para Vercel
module.exports = app;
