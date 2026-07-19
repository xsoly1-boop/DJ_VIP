// ===========================================================================
// DJ Panel Pro — Compilador macOS v4 (GUI Completa — equivalente a build-macos.sh)
// Respeta TODAS las opciones del script original + versión editable + copiar rutas
// ===========================================================================

import AppKit
import Foundation

let app = NSApplication.shared
app.setActivationPolicy(.regular)

// MARK: - Color Palette
struct C {
    static let bg       = NSColor(red: 0.04, green: 0.02, blue: 0.12, alpha: 1)
    static let panel    = NSColor(red: 0.09, green: 0.05, blue: 0.20, alpha: 1)
    static let panel2   = NSColor(red: 0.07, green: 0.03, blue: 0.16, alpha: 1)
    static let border   = NSColor(red: 0.30, green: 0.12, blue: 0.55, alpha: 1)
    static let accent   = NSColor(red: 0.68, green: 0.42, blue: 1.00, alpha: 1)
    static let green    = NSColor(red: 0.18, green: 0.90, blue: 0.52, alpha: 1)
    static let red      = NSColor(red: 1.00, green: 0.28, blue: 0.36, alpha: 1)
    static let yellow   = NSColor(red: 1.00, green: 0.82, blue: 0.20, alpha: 1)
    static let text     = NSColor.white                                          // ← todas las letras: blanco puro
    static let dim      = NSColor(red: 0.72, green: 0.72, blue: 0.72, alpha: 1) // ← subtextos: gris claro
    static let termBg   = NSColor.black                                          // ← consola: negro puro
    static let termFg   = NSColor(red: 0.20, green: 1.00, blue: 0.40, alpha: 1) // ← texto consola: verde brillante
}

// MARK: - AppDelegate
class AppDelegate: NSObject, NSApplicationDelegate {

    var window: NSWindow!
    var outputView: NSTextView!

    // ── Architecture
    var radioArm64:     NSButton!
    var radioX64:       NSButton!
    var radioUniversal: NSButton!
    var radioCurrent:   NSButton!

    // ── Build Options
    var chkClean:       NSButton!
    var chkInstallDeps: NSButton!
    var chkCodesign:    NSButton!       // ad-hoc codesign app + dmg
    var chkInstallRosetta: NSButton!    // auto-install Rosetta 2
    var chkOpenFinder:  NSButton!

    // ── Environment / Config
    var urlField:       NSTextField!    // VITE_PUBLIC_URL editable
    var versionField:   NSTextField!    // Version editable (updates package.json)
    var envStatusLabel: NSTextField!
    var nodeVerLabel:   NSTextField!
    var chipLabel:      NSTextField!
    var rosettaLabel:   NSTextField!
    var supabaseLabel:  NSTextField!

    // ── State: generated DMG paths after build
    var generatedDMGPaths: [String] = []
    var copyBtn: NSButton!

    // ── Progress bars (5 stages now)
    var stages: [(bar: NSProgressIndicator, pct: NSTextField, status: NSTextField)] = []
    let stageNames = [
        "1/5  Verificar entorno  &  .env",
        "2/5  Dependencias  (npm ci)",
        "3/5  Frontend  (vite build)",
        "4/5  Empaquetar  (electron-builder)",
        "5/5  Firma ad-hoc  (codesign)"
    ]

    // ── Buttons
    var startBtn:  NSButton!
    var cancelBtn: NSButton!

    // ── State
    var isBuilding = false
    var currentTask: Process?
    var buildTask: DispatchWorkItem?

    // ── Detected env values
    var detectedPublicURL  = ""
    var detectedFirebaseId = ""
    var detectedStorageBucket = ""
    var detectedSupabaseURL = ""

    // MARK: - Launch
    func applicationDidFinishLaunching(_ notification: Notification) {
        buildWindow()
        setupMenu()
        window.makeKeyAndOrderFront(nil)
        window.zoom(nil) // Maximizar ventana por defecto en pantallas de cualquier tamaño
        NSApp.activate(ignoringOtherApps: true)
        detectEnvironment()
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    // MARK: - Build Window ─────────────────────────────────────────────────
    func buildWindow() {
        let W: CGFloat = 1200, H: CGFloat = 800
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: W, height: H),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered, defer: false)
        window.title = "DJ Panel Pro — Compilador macOS"
        window.minSize = NSSize(width: 1150, height: 750)
        window.center()
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: .darkAqua)

        let root = cview(C.bg, frame: NSRect(x: 0, y: 0, width: W, height: H))
        root.autoresizingMask = [.width, .height]

        // ── HEADER
        let hdr = cview(C.panel, frame: NSRect(x: 0, y: H - 78, width: W, height: 78))
        hdr.autoresizingMask = [.width, .minYMargin]
        hline(hdr, w: W, color: C.border)
        lbl("💿", size: 34, frame: NSRect(x: 18, y: 16, width: 50, height: 46), in: hdr)
        lbl("DJ Panel Pro — Compilador macOS", size: 20, bold: true, color: C.text,
            frame: NSRect(x: 74, y: 44, width: 600, height: 28), in: hdr)
        lbl("Equivalente completo de build-macos.sh con interfaz gráfica", size: 12, color: C.dim,
            frame: NSRect(x: 74, y: 26, width: 600, height: 16), in: hdr)
        root.addSubview(hdr)

        // ── COLUMN 1 (x: 16, width: 360) - Architecture & Options
        let col1 = NSView(frame: NSRect(x: 16, y: 16, width: 360, height: H - 78 - 32))
        col1.autoresizingMask = [.height, .maxXMargin]
        
        // archP
        let archP = panel(frame: NSRect(x: 0, y: col1.frame.height - 310, width: 360, height: 310))
        sectionTitle("🎯  ARQUITECTURA DE COMPILACIÓN", in: archP, yTop: 310 - 8)
        
        func addRadio(_ title: String, sub: String, ry: CGFloat, tag: Int, parent: NSView) -> NSButton {
            let r = NSButton(radioButtonWithTitle: "  " + title, target: self, action: #selector(radioChanged(_:)))
            r.frame = NSRect(x: 14, y: ry, width: 330, height: 22)
            r.tag = tag; r.state = tag == 0 ? .on : .off
            r.font = .systemFont(ofSize: 13, weight: .medium)
            r.contentTintColor = C.text
            parent.addSubview(r)
            lbl(sub, size: 11, color: C.dim, frame: NSRect(x: 36, y: ry - 14, width: 310, height: 14), in: parent)
            return r
        }
        
        radioArm64     = addRadio("🍎  Apple Silicon (arm64)", sub: "Nativo en Mac M1/M2/M3/M4. Máximo rendimiento.", ry: 310 - 60, tag: 0, parent: archP)
        radioX64       = addRadio("🖥️   Intel x64 (macOS 10.14+)", sub: "Compatible con Mac Intel.", ry: 310 - 110, tag: 1, parent: archP)
        radioUniversal = addRadio("🌐  Universal (arm64 + x64)", sub: "Un solo instalador para cualquier Mac. Más pesado.", ry: 310 - 160, tag: 2, parent: archP)
        radioCurrent   = addRadio("⚡  Automático (chip actual)", sub: "Detecta el chip nativo y compila para él.", ry: 310 - 210, tag: 3, parent: archP)
        col1.addSubview(archP)

        // optP
        let optP = panel(frame: NSRect(x: 0, y: col1.frame.height - 310 - 16 - 310, width: 360, height: 310))
        sectionTitle("⚙️  OPCIONES DE COMPILACIÓN", in: optP, yTop: 310 - 8)
        
        func addCheck(_ title: String, sub: String, oy: CGFloat, def: NSControl.StateValue = .on, parent: NSView) -> NSButton {
            let c = NSButton(checkboxWithTitle: "  " + title, target: nil, action: nil)
            c.frame = NSRect(x: 14, y: oy, width: 330, height: 22)
            c.state = def
            c.font = .systemFont(ofSize: 13, weight: .medium)
            c.contentTintColor = C.text
            parent.addSubview(c)
            lbl(sub, size: 11, color: C.dim, frame: NSRect(x: 36, y: oy - 14, width: 310, height: 14), in: parent)
            return c
        }
        
        chkClean           = addCheck("🧹  Limpiar dist/ y dist-desktop/", sub: "Borra builds anteriores antes de compilar.", oy: 310 - 60, parent: optP)
        chkInstallDeps     = addCheck("📦  Instalar dependencias (npm ci)", sub: "Reinstala node_modules desde package-lock.json.", oy: 310 - 110, parent: optP)
        chkCodesign        = addCheck("🔏  Firma ad-hoc (codesign)", sub: "Firma la app y el DMG sin Developer ID.", oy: 310 - 160, parent: optP)
        chkInstallRosetta  = addCheck("⚙️  Instalar Rosetta 2", sub: "Requerido para compilar Intel en Mac Silicon.", oy: 310 - 210, def: .off, parent: optP)
        col1.addSubview(optP)
        root.addSubview(col1)

        // ── COLUMN 2 (x: 392, width: 360) - Environment & Config
        let col2 = NSView(frame: NSRect(x: 392, y: 16, width: 360, height: H - 78 - 32))
        col2.autoresizingMask = [.height, .maxXMargin]

        // envP
        let envP = panel(frame: NSRect(x: 0, y: col2.frame.height - 200, width: 360, height: 200))
        sectionTitle("🔍  ENTORNO DETECTADO", in: envP, yTop: 200 - 8)
        
        nodeVerLabel  = lbl("Node.js: detectando…", size: 12, color: C.dim, frame: NSRect(x: 14, y: 200 - 56, width: 332, height: 16), in: envP)
        chipLabel     = lbl("Chip: detectando…",    size: 12, color: C.dim, frame: NSRect(x: 14, y: 200 - 76, width: 332, height: 16), in: envP)
        rosettaLabel  = lbl("Rosetta 2: —",         size: 12, color: C.dim, frame: NSRect(x: 14, y: 200 - 96, width: 332, height: 16), in: envP)
        supabaseLabel = lbl("Supabase URL: —",       size: 12, color: C.dim, frame: NSRect(x: 14, y: 200 - 116, width: 332, height: 16), in: envP)
        envStatusLabel = lbl(".env: detectando…",   size: 12, color: C.dim, frame: NSRect(x: 14, y: 200 - 136, width: 332, height: 16), in: envP)
        col2.addSubview(envP)

        // cfgP
        let cfgP = panel(frame: NSRect(x: 0, y: col2.frame.height - 200 - 16 - 420, width: 360, height: 420))
        sectionTitle("🌐  CONFIGURACIÓN Y POST-BUILD", in: cfgP, yTop: 420 - 8)
        
        lbl("Versión de compilación (actualiza package.json):", size: 11, bold: true, color: C.dim,
            frame: NSRect(x: 14, y: 420 - 46, width: 332, height: 16), in: cfgP)
        
        versionField = NSTextField(frame: NSRect(x: 14, y: 420 - 72, width: 140, height: 24))
        versionField.placeholderString = "1.0.0"
        versionField.font = .monospacedSystemFont(ofSize: 13, weight: .bold)
        versionField.backgroundColor = C.bg
        versionField.textColor = C.accent
        versionField.bezelStyle = .roundedBezel
        versionField.isBezeled = true
        cfgP.addSubview(versionField)
        
        lbl("Ej: 1.0.0 · 2.0.1-beta", size: 10, color: C.dim,
            frame: NSRect(x: 162, y: 420 - 66, width: 180, height: 14), in: cfgP)

        lbl("URL de producción (VITE_PUBLIC_URL):", size: 11, bold: true, color: C.dim,
            frame: NSRect(x: 14, y: 420 - 102, width: 332, height: 16), in: cfgP)
            
        urlField = NSTextField(frame: NSRect(x: 14, y: 420 - 128, width: 332, height: 24))
        urlField.placeholderString = "https://dj-vip.onrender.com"
        urlField.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        urlField.backgroundColor = C.bg
        urlField.textColor = C.text
        urlField.bezelStyle = .roundedBezel
        urlField.isBezeled = true
        cfgP.addSubview(urlField)
        
        lbl("Se guarda en .env automáticamente al compilar.", size: 10, color: C.dim,
            frame: NSRect(x: 14, y: 420 - 144, width: 332, height: 14), in: cfgP)
            
        let sep2 = cview(C.border, frame: NSRect(x: 14, y: 420 - 158, width: 332, height: 1))
        cfgP.addSubview(sep2)
        
        lbl("Post-build:", size: 11, bold: true, color: C.dim,
            frame: NSRect(x: 14, y: 420 - 176, width: 332, height: 16), in: cfgP)
            
        chkOpenFinder = NSButton(checkboxWithTitle: "  📂  Abrir Finder al terminar", target: nil, action: nil)
        chkOpenFinder.frame = NSRect(x: 14, y: 420 - 200, width: 332, height: 22)
        chkOpenFinder.state = .on
        chkOpenFinder.font = .systemFont(ofSize: 13, weight: .medium)
        chkOpenFinder.contentTintColor = C.text
        cfgP.addSubview(chkOpenFinder)
        
        let sep3 = cview(C.border, frame: NSRect(x: 14, y: 420 - 215, width: 332, height: 1))
        cfgP.addSubview(sep3)
        
        copyBtn = NSButton(title: "  📋  Copiar Rutas DMG", target: self, action: #selector(copyDMGPaths))
        copyBtn.frame = NSRect(x: 14, y: 420 - 265, width: 332, height: 34)
        copyBtn.bezelStyle = .rounded; copyBtn.font = .boldSystemFont(ofSize: 13)
        copyBtn.bezelColor = NSColor(red: 0.08, green: 0.18, blue: 0.10, alpha: 1)
        copyBtn.contentTintColor = C.green
        cfgP.addSubview(copyBtn)
        
        let openFolderBtn = NSButton(title: "  📂  Abrir dist-desktop", target: self, action: #selector(openFolder))
        openFolderBtn.frame = NSRect(x: 14, y: 420 - 315, width: 332, height: 34)
        openFolderBtn.bezelStyle = .rounded; openFolderBtn.font = .systemFont(ofSize: 13)
        openFolderBtn.bezelColor = C.panel2; openFolderBtn.contentTintColor = C.text
        cfgP.addSubview(openFolderBtn)
        
        col2.addSubview(cfgP)
        root.addSubview(col2)

        // ── COLUMN 3 (x: 768, width: W - 768 - 16) - Progress, Buttons, Terminal
        let col3 = NSView(frame: NSRect(x: 768, y: 16, width: W - 768 - 16, height: H - 78 - 32))
        col3.autoresizingMask = [.width, .height, .minXMargin]
        
        // progP
        let progH: CGFloat = 220
        let progP = panel(frame: NSRect(x: 0, y: col3.frame.height - progH, width: col3.frame.width, height: progH))
        progP.autoresizingMask = [.width, .minYMargin]
        sectionTitle("📊  PROGRESO DE COMPILACIÓN", in: progP, yTop: progH - 8)
        
        stages = []
        let barYs: [CGFloat] = [progH - 52, progH - 84, progH - 116, progH - 148, progH - 180]
        for (i, by) in barYs.enumerated() {
            let nl = lbl(stageNames[i], size: 11, bold: true, color: C.dim,
                         frame: NSRect(x: 14, y: by + 18, width: 300, height: 14), in: progP)
            
            let sl = lbl("Esperando…", size: 11, color: C.dim,
                         frame: NSRect(x: col3.frame.width - 320 - 80, y: by + 18, width: 300, height: 14), in: progP)
            sl.alignment = .right
            sl.autoresizingMask = .minXMargin
            
            let bar = NSProgressIndicator()
            bar.frame = NSRect(x: 14, y: by + 2, width: col3.frame.width - 110, height: 12)
            bar.style = .bar; bar.minValue = 0; bar.maxValue = 100; bar.doubleValue = 0
            bar.isIndeterminate = false
            bar.wantsLayer = true; bar.layer?.cornerRadius = 5
            bar.autoresizingMask = .width
            progP.addSubview(bar)
            
            let pl = lbl("0 %", size: 11, bold: true, color: C.accent,
                         frame: NSRect(x: col3.frame.width - 86, y: by + 2, width: 72, height: 14), in: progP)
            pl.alignment = .right
            pl.autoresizingMask = .minXMargin
            
            stages.append((bar: bar, pct: pl, status: sl))
            let _ = nl
        }
        col3.addSubview(progP)

        // abP (Action Buttons)
        let abH: CGFloat = 60
        let abP = panel(frame: NSRect(x: 0, y: col3.frame.height - progH - 16 - abH, width: col3.frame.width, height: abH))
        abP.autoresizingMask = [.width, .minYMargin]
        
        startBtn = NSButton(title: "  ▶   S T A R T", target: self, action: #selector(startBuild))
        startBtn.frame = NSRect(x: 14, y: 13, width: 180, height: 34)
        startBtn.bezelStyle = .rounded; startBtn.font = .boldSystemFont(ofSize: 15)
        startBtn.bezelColor = C.accent; startBtn.contentTintColor = .white
        startBtn.keyEquivalent = "\r"
        startBtn.autoresizingMask = .maxXMargin
        abP.addSubview(startBtn)
        
        cancelBtn = NSButton(title: "  ✕   CANCELAR", target: self, action: #selector(cancelBuild))
        cancelBtn.frame = NSRect(x: 210, y: 13, width: 180, height: 34)
        cancelBtn.bezelStyle = .rounded; cancelBtn.font = .boldSystemFont(ofSize: 15)
        cancelBtn.bezelColor = NSColor(red: 0.22, green: 0.06, blue: 0.08, alpha: 1)
        cancelBtn.contentTintColor = C.red; cancelBtn.isEnabled = false
        cancelBtn.autoresizingMask = .maxXMargin
        abP.addSubview(cancelBtn)
        col3.addSubview(abP)

        // termP (Console Terminal view)
        let termY = col3.frame.height - progH - 16 - abH - 16
        let termP = NSView(frame: NSRect(x: 0, y: 0, width: col3.frame.width, height: termY))
        termP.autoresizingMask = [.width, .height]
        
        let thdr = cview(C.termBg, frame: NSRect(x: 0, y: termY - 26, width: col3.frame.width, height: 26))
        thdr.wantsLayer = true
        thdr.layer?.cornerRadius = 10
        thdr.layer?.maskedCorners = [.layerMinXMaxYCorner, .layerMaxXMaxYCorner]
        thdr.autoresizingMask = [.width, .minYMargin]
        lbl("● ● ●  CONSOLA DE COMPILACIÓN", size: 11, bold: true, color: C.termFg,
            frame: NSRect(x: 12, y: 6, width: 280, height: 14), in: thdr)
        termP.addSubview(thdr)
        
        let sv = NSScrollView(frame: NSRect(x: 0, y: 0, width: col3.frame.width, height: termY - 26))
        sv.hasVerticalScroller = true; sv.borderType = .noBorder
        sv.wantsLayer = true; sv.layer?.backgroundColor = C.termBg.cgColor
        sv.layer?.cornerRadius = 10
        sv.layer?.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        sv.autoresizingMask = [.width, .height]
        
        outputView = NSTextView(frame: NSRect(x: 0, y: 0, width: col3.frame.width, height: max(termY - 26, 800)))
        outputView.isEditable = false; outputView.isSelectable = true
        outputView.backgroundColor = .clear; outputView.textColor = C.termFg
        outputView.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
        outputView.textContainerInset = NSSize(width: 12, height: 10)
        outputView.drawsBackground = false
        outputView.autoresizingMask = [.width, .height]
        
        sv.documentView = outputView
        termP.addSubview(sv)
        col3.addSubview(termP)
        
        root.addSubview(col3)
        window.contentView = root
    }

    // MARK: - Environment Detection ────────────────────────────────────────
    func detectEnvironment() {
        let dir = projectDir()
        log("💿  DJ Panel Pro — Compilador macOS v3\n", color: C.accent)
        log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
        log("📂  Proyecto: \(dir)\n\n")

        // Node.js
        let nodeVer = shellOutput("node -v").trimmingCharacters(in: .whitespacesAndNewlines)
        let npmVer  = shellOutput("npm -v").trimmingCharacters(in: .whitespacesAndNewlines)
        nodeVerLabel.stringValue = "✅  Node.js \(nodeVer)  |  npm \(npmVer)"
        nodeVerLabel.textColor = nodeVer.hasPrefix("v") ? C.green : C.red
        log("✅  Node.js \(nodeVer)   npm \(npmVer)\n")

        // Chip
        let arch = shellOutput("uname -m").trimmingCharacters(in: .whitespacesAndNewlines)
        let chipName = arch == "arm64" ? "Apple Silicon (arm64)" : "Intel x86_64"
        chipLabel.stringValue = "✅  Chip: \(chipName)"
        chipLabel.textColor = C.green
        log("✅  Chip: \(chipName)\n")

        // Rosetta 2
        let rosetta = FileManager.default.fileExists(atPath: "/Library/Apple/usr/share/rosetta/rosetta")
        rosettaLabel.stringValue = rosetta ? "✅  Rosetta 2: Instalada" : "⚠️  Rosetta 2: No instalada"
        rosettaLabel.textColor = rosetta ? C.green : C.yellow
        log(rosetta ? "✅  Rosetta 2: Instalada\n" : "⚠️  Rosetta 2: No instalada\n")

        // .env file
        let envPath = "\(dir)/.env"
        if FileManager.default.fileExists(atPath: envPath) {
            let env = loadEnv(path: envPath)
            detectedPublicURL     = env["VITE_PUBLIC_URL"]     ?? ""
            detectedFirebaseId    = env["VITE_FIREBASE_PROJECT_ID"] ?? ""
            detectedStorageBucket = env["VITE_FIREBASE_STORAGE_BUCKET"] ?? ""
            detectedSupabaseURL   = env["VITE_SUPABASE_URL"]   ?? ""

            envStatusLabel.stringValue = "✅  .env detectado"
            envStatusLabel.textColor = C.green

            if !detectedPublicURL.isEmpty {
                urlField.stringValue = detectedPublicURL
                log("✅  VITE_PUBLIC_URL: \(detectedPublicURL)\n")
            } else {
                log("⚠️  VITE_PUBLIC_URL no configurada — QR apuntará a localhost\n", color: C.yellow)
            }
            if !detectedFirebaseId.isEmpty {
                log("✅  Firebase Project: \(detectedFirebaseId)\n")
            }
            if !detectedSupabaseURL.isEmpty {
                supabaseLabel.stringValue = "✅  Supabase: \(detectedSupabaseURL)"
                supabaseLabel.textColor = C.green
                log("✅  Supabase URL: \(detectedSupabaseURL)\n")
            } else {
                supabaseLabel.stringValue = "⚠️  Supabase: No configurado"
                supabaseLabel.textColor = C.yellow
            }
        } else {
            envStatusLabel.stringValue = "⚠️  Sin .env — modo local"
            envStatusLabel.textColor = C.yellow
            log("⚠️  No se encontró .env — la app compilará en modo LOCAL\n", color: C.yellow)
        }
        // Detect current version from package.json
        let pkgPath = "\(dir)/package.json"
        if let data = try? Data(contentsOf: URL(fileURLWithPath: pkgPath)),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let version = json["version"] as? String {
            versionField.stringValue = version
            log("✅  Versión actual en package.json: \(version)\n")
        } else {
            versionField.stringValue = "1.0.0"
            log("⚠️  No se pudo leer version de package.json\n", color: C.yellow)
        }

        log("\nSelecciona la arquitectura y presiona  Start.\n")
    }

    func loadEnv(path: String) -> [String: String] {
        var env: [String: String] = [:]
        guard let content = try? String(contentsOfFile: path, encoding: .utf8) else { return env }
        for line in content.components(separatedBy: "\n") {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("#") || trimmed.isEmpty { continue }
            let parts = trimmed.components(separatedBy: "=")
            guard parts.count >= 2 else { continue }
            let key = parts[0].trimmingCharacters(in: .whitespaces)
            var val = parts.dropFirst().joined(separator: "=")
                .trimmingCharacters(in: .whitespaces)
                .trimmingCharacters(in: CharacterSet(charactersIn: "\"'"))
            if let commentIdx = val.firstIndex(of: "#") {
                val = String(val[..<commentIdx]).trimmingCharacters(in: .whitespaces)
            }
            env[key] = val
        }
        return env
    }

    // MARK: - Radio changed
    @objc func radioChanged(_ sender: NSButton) {
        for r in [radioArm64, radioX64, radioUniversal, radioCurrent] { r?.state = .off }
        sender.state = .on
    }

    // MARK: - START ────────────────────────────────────────────────────────
    @objc func startBuild() {
        guard !isBuilding else { return }

        let arch: String
        if radioArm64.state == .on          { arch = "arm64" }
        else if radioX64.state == .on        { arch = "x64" }
        else if radioUniversal.state == .on  { arch = "universal" }
        else {
            // auto-detect current chip
            let native = shellOutput("uname -m").trimmingCharacters(in: .whitespacesAndNewlines)
            arch = native == "arm64" ? "arm64" : "x64"
        }

        let doClean       = chkClean.state == .on
        let doInstall     = chkInstallDeps.state == .on
        let doCodesign    = chkCodesign.state == .on
        let doRosetta     = chkInstallRosetta.state == .on
        let doFinder      = chkOpenFinder.state == .on
        let publicURL     = urlField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        let dir           = projectDir()

        isBuilding = true
        setUIBuilding(true)
        resetBars()

        log("\n\n")
        log("╔══════════════════════════════════════════════════════════════╗\n", color: C.accent)
        log("║  🚀  Iniciando compilación — Arquitectura: \(arch.padding(toLength: 10, withPad: " ", startingAt: 0))          ║\n", color: C.accent)
        log("╚══════════════════════════════════════════════════════════════╝\n\n", color: C.accent)

        buildTask = DispatchWorkItem { [weak self] in
            guard let self else { return }
            self.phase_checkEnv(dir: dir, arch: arch, publicURL: publicURL,
                                doClean: doClean, doInstall: doInstall,
                                doCodesign: doCodesign, doRosetta: doRosetta,
                                doFinder: doFinder)
        }
        DispatchQueue.global(qos: .userInitiated).async(execute: buildTask!)
    }

    // ── Phase 0: Check env + handle .env URL + Rosetta ───────────────────
    func phase_checkEnv(dir: String, arch: String, publicURL: String,
                        doClean: Bool, doInstall: Bool, doCodesign: Bool,
                        doRosetta: Bool, doFinder: Bool) {
        startStage(0, msg: "Verificando entorno…")
        if isCancelled { return }

        // ── Update version in package.json if changed
        let newVersion = versionField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        if !newVersion.isEmpty {
            let pkgPath = "\(dir)/package.json"
            if let data = try? Data(contentsOf: URL(fileURLWithPath: pkgPath)),
               var json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                let oldVersion = json["version"] as? String ?? "?"
                if oldVersion != newVersion {
                    json["version"] = newVersion
                    if let newData = try? JSONSerialization.data(withJSONObject: json, options: [.prettyPrinted, .sortedKeys]),
                       var text = String(data: newData, encoding: .utf8) {
                        // JSONSerialization uses 2-space indent, keep it clean
                        try? text.write(toFile: pkgPath, atomically: true, encoding: .utf8)
                        log("  ✅  Versión actualizada: \(oldVersion) → \(newVersion) en package.json\n", color: C.green)
                    }
                } else {
                    log("  ✅  Versión: \(newVersion) (sin cambios)\n")
                }
            }
        }

        // ── Save VITE_PUBLIC_URL to .env if changed
        if !publicURL.isEmpty && publicURL != detectedPublicURL {
            let envPath = "\(dir)/.env"
            log("  💾  Guardando VITE_PUBLIC_URL en .env…\n", color: C.yellow)
            if FileManager.default.fileExists(atPath: envPath),
               let content = try? String(contentsOfFile: envPath, encoding: .utf8) {
                let updated: String
                if content.contains("VITE_PUBLIC_URL") {
                    updated = content.components(separatedBy: "\n").map { line in
                        line.hasPrefix("VITE_PUBLIC_URL") ? "VITE_PUBLIC_URL=\(publicURL)" : line
                    }.joined(separator: "\n")
                } else {
                    updated = content + "\nVITE_PUBLIC_URL=\(publicURL)\n"
                }
                try? updated.write(toFile: envPath, atomically: true, encoding: .utf8)
            } else {
                let line = "VITE_PUBLIC_URL=\(publicURL)\n"
                try? line.write(toFile: "\(dir)/.env", atomically: true, encoding: .utf8)
            }
            log("  ✅  VITE_PUBLIC_URL guardada: \(publicURL)\n")
        }

        // Install Rosetta if needed
        if doRosetta && (arch == "x64" || arch == "universal") {
            let hasRosetta = FileManager.default.fileExists(atPath: "/Library/Apple/usr/share/rosetta/rosetta")
            if !hasRosetta {
                log("  ⚙️  Instalando Rosetta 2…\n", color: C.yellow)
                shellRun("softwareupdate --install-rosetta --agree-to-license 2>/dev/null || true")
                log("  ✅  Rosetta 2 instalada\n")
            } else {
                log("  ✅  Rosetta 2 ya está instalada\n")
            }
        }

        // Node check
        let nodeVer = shellOutput("node -v").trimmingCharacters(in: .whitespacesAndNewlines)
        if nodeVer.isEmpty {
            return failBuild("Node.js no está instalado. Instálalo desde https://nodejs.org/")
        }
        log("  ✅  Node.js \(nodeVer)\n")

        prog(0, 100)
        doneStage(0)
        if isCancelled { return }
        phase_deps(dir: dir, arch: arch, publicURL: publicURL,
                   doClean: doClean, doInstall: doInstall,
                   doCodesign: doCodesign, doFinder: doFinder)
    }

    // ── Phase 1: Clean + Install deps ────────────────────────────────────
    func phase_deps(dir: String, arch: String, publicURL: String,
                    doClean: Bool, doInstall: Bool, doCodesign: Bool, doFinder: Bool) {
        startStage(1, msg: "Instalando dependencias…")
        if isCancelled { return }

        if doClean {
            log("\n🧹  Limpiando dist/ y dist-desktop/…\n", color: C.yellow)
            shellRun("rm -rf '\(dir)/dist' '\(dir)/dist-desktop'")
            log("  ✅  Carpetas dist/ y dist-desktop/ eliminadas\n")
        }
        prog(1, 20)

        if doInstall {
            let hasLock = FileManager.default.fileExists(atPath: "\(dir)/package-lock.json")
            let installCmd = hasLock
                ? "cd '\(dir)' && npm ci --include=dev 2>&1"
                : "cd '\(dir)' && npm install --include=dev 2>&1"
            log("\n📦  \(hasLock ? "npm ci" : "npm install") --include=dev\n", color: C.yellow)
            let ok = streamShell(installCmd, stageIdx: 1, approxLines: 100)
            if !ok { return failBuild("npm install falló. Revisa la consola.") }
        } else {
            log("  ⏭️  Instalación de dependencias omitida\n", color: C.dim)
        }

        prog(1, 100)
        doneStage(1)
        if isCancelled { return }
        phase_vite(dir: dir, arch: arch, publicURL: publicURL,
                   doCodesign: doCodesign, doFinder: doFinder)
    }

    // ── Phase 2: Vite build ───────────────────────────────────────────────
    func phase_vite(dir: String, arch: String, publicURL: String,
                    doCodesign: Bool, doFinder: Bool) {
        startStage(2, msg: "Compilando React + Vite…")
        if isCancelled { return }

        log("\n⚡  Compilando frontend (React + Vite)…\n", color: C.yellow)
        // Inject VITE_PUBLIC_URL if provided
        let envPrefix = publicURL.isEmpty ? "" : "VITE_PUBLIC_URL='\(publicURL)' "
        let ok = streamShell("\(envPrefix)cd '\(dir)' && npm run build 2>&1", stageIdx: 2, approxLines: 20)
        if !ok { return failBuild("Vite build falló. Revisa la consola.") }

        prog(2, 100)
        doneStage(2)
        if isCancelled { return }
        phase_electron(dir: dir, arch: arch, doCodesign: doCodesign, doFinder: doFinder)
    }

    // ── Phase 3: electron-builder (with --dir + codesign + dmg) ──────────
    func phase_electron(dir: String, arch: String, doCodesign: Bool, doFinder: Bool) {
        startStage(3, msg: "Empaquetando con electron-builder…")
        if isCancelled { return }

        log("\n🔨  Empaquetando instalador (\(arch))…\n", color: C.yellow)

        // Step A: --dir first (unpackaged app folder) for codesign
        if doCodesign {
            log("  📂  Generando carpeta de app sin empaquetar (--dir)…\n")
            let dirCmd = "cd '\(dir)' && CSC_IDENTITY_AUTO_DISCOVERY=false CSC_LINK='' npx electron-builder --mac --dir --\(arch) --publish never 2>&1"
            let okDir = streamShell(dirCmd, stageIdx: 3, approxLines: 20, maxPct: 40)
            if !okDir { return failBuild("electron-builder --dir falló.") }
            prog(3, 40)
            if isCancelled { return }
            phase_codesign(dir: dir, arch: arch, doFinder: doFinder)
        } else {
            // Without codesign — just build the DMG directly
            let cmd = "cd '\(dir)' && CSC_IDENTITY_AUTO_DISCOVERY=false CSC_LINK='' npx electron-builder --mac --\(arch) --publish never 2>&1"
            let ok = streamShell(cmd, stageIdx: 3, approxLines: 30)
            if !ok { return failBuild("electron-builder falló.") }
            prog(3, 100)
            doneStage(3)
            // Skip codesign, go directly to done
            prog(4, 100)
            doneStage(4)
            if isCancelled { return }
            buildDone(dir: dir, doFinder: doFinder)
        }
    }

    // ── Phase 4: ad-hoc codesign + DMG ────────────────────────────────────
    func phase_codesign(dir: String, arch: String, doFinder: Bool) {
        startStage(4, msg: "Aplicando firma ad-hoc…")
        if isCancelled { return }

        // Find the .app folder
        let appFolder: String
        switch arch {
        case "arm64":     appFolder = "\(dir)/dist-desktop/mac-arm64"
        case "x64":       appFolder = "\(dir)/dist-desktop/mac"
        case "universal": appFolder = "\(dir)/dist-desktop/mac-universal"
        default:          appFolder = "\(dir)/dist-desktop"
        }

        // Find .app bundle inside the folder
        let appPath = shellOutput("find '\(appFolder)' -name '*.app' -maxdepth 2 2>/dev/null | head -1")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        if !appPath.isEmpty {
            log("  🔏  Aplicando firma ad-hoc a la App…\n  \(appPath)\n", color: C.yellow)
            shellRun("codesign --force --deep --sign - '\(appPath)' 2>/dev/null || true")
            log("  ✅  Firma aplicada a la App\n")
        } else {
            log("  ⚠️  No se encontró la .app para firmar\n", color: C.yellow)
        }
        prog(4, 50)

        // Now build the DMG from the pre-packaged (signed) app
        log("\n  📦  Creando DMG con app ya firmada…\n", color: C.yellow)
        let packCmd: String
        if !appPath.isEmpty {
            packCmd = "cd '\(dir)' && CSC_IDENTITY_AUTO_DISCOVERY=false CSC_LINK='' npx electron-builder --mac --\(arch) --prepackaged '\(appPath)' --publish never 2>&1"
        } else {
            packCmd = "cd '\(dir)' && CSC_IDENTITY_AUTO_DISCOVERY=false CSC_LINK='' npx electron-builder --mac --\(arch) --publish never 2>&1"
        }
        let okDmg = streamShell(packCmd, stageIdx: 3, approxLines: 10, minPct: 40, maxPct: 100)
        if !okDmg { return failBuild("Creación del DMG falló.") }
        prog(3, 100); doneStage(3)
        if isCancelled { return }

        // Sign the DMG container too
        let dmgPath = shellOutput("find '\(dir)/dist-desktop' -name '*.dmg' 2>/dev/null | head -1")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !dmgPath.isEmpty {
            log("  🔏  Aplicando firma ad-hoc al archivo DMG…\n", color: C.yellow)
            shellRun("codesign --force --sign - '\(dmgPath)' 2>/dev/null || true")
            log("  ✅  Firma aplicada al DMG\n")
        }

        // Remove quarantine for easier first open
        shellRun("xattr -cr '\(dir)/dist-desktop' 2>/dev/null || true")
        log("  ✅  Atributo quarantine eliminado\n")

        prog(4, 100); doneStage(4)
        if isCancelled { return }
        buildDone(dir: dir, doFinder: doFinder)
    }

    // ── Build finished ────────────────────────────────────────────────────
    func buildDone(dir: String, doFinder: Bool) {
        let dmgArm = shellOutput("find '\(dir)/dist-desktop' -name '*arm64*.dmg' 2>/dev/null | head -1").trimmingCharacters(in: .whitespacesAndNewlines)
        let dmgX64 = shellOutput("find '\(dir)/dist-desktop' -name '*.dmg' ! -name '*arm64*' ! -name '*universal*' 2>/dev/null | head -1").trimmingCharacters(in: .whitespacesAndNewlines)
        let dmgUni = shellOutput("find '\(dir)/dist-desktop' -name '*universal*.dmg' 2>/dev/null | head -1").trimmingCharacters(in: .whitespacesAndNewlines)

        // Store generated paths for the copy button
        generatedDMGPaths = [dmgArm, dmgX64, dmgUni].filter { !$0.isEmpty }

        DispatchQueue.main.async {
            self.isBuilding = false
            self.setUIBuilding(false)

            self.log("\n")
            self.log("╔══════════════════════════════════════════════════════════════╗\n", color: C.green)
            self.log("║  🎉  ¡COMPILACIÓN EXITOSA! LOS INSTALADORES ESTÁN LISTOS   ║\n", color: C.green)
            self.log("╚══════════════════════════════════════════════════════════════╝\n\n", color: C.green)

            let showDmg = { (label: String, path: String) in
                if !path.isEmpty {
                    let size = self.shellOutput("du -sh '\(path)' | cut -f1").trimmingCharacters(in: .whitespacesAndNewlines)
                    self.log("  \(label): \(path)  (\(size))\n", color: C.text)
                }
            }
            showDmg("🍎 Apple Silicon", dmgArm)
            showDmg("🖥️  Intel x64    ", dmgX64)
            showDmg("🌐 Universal    ", dmgUni)

            let url = self.urlField.stringValue
            if !url.isEmpty {
                self.log("\n  🔗  URL embebida en QR: \(url)\n", color: C.accent)
            }

            self.log("\n")
            self.log("  ┌──────────────────────────────────────────────────────────┐\n", color: C.yellow)
            self.log("  │  CÓMO INSTALAR EN OTRO MAC (sin Developer ID)            │\n", color: C.yellow)
            self.log("  │  1. Copia el .dmg (USB, AirDrop, Drive)                 │\n", color: C.yellow)
            self.log("  │  2. Doble clic para abrir el .dmg                       │\n", color: C.yellow)
            self.log("  │  3. Arrastra 'DJ Panel Pro' a Aplicaciones              │\n", color: C.yellow)
            self.log("  │  4. Primera apertura: clic derecho → 'Abrir'            │\n", color: C.yellow)
            self.log("  │  💡 Si Gatekeeper bloquea: xattr -cr '/Applications/... │\n", color: C.yellow)
            self.log("  └──────────────────────────────────────────────────────────┘\n", color: C.yellow)

            if doFinder {
                let p = "\(dir)/dist-desktop"
                if FileManager.default.fileExists(atPath: p) {
                    NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: p)
                }
            }

            let alert = NSAlert()
            alert.messageText = "✅ ¡Compilación exitosa!"
            alert.informativeText = "Los instaladores .dmg están en dist-desktop/\n\nRecuerda: primera apertura con clic derecho → Abrir."
            alert.alertStyle = .informational
            alert.addButton(withTitle: "Abrir Finder")
            alert.addButton(withTitle: "Cerrar")
            if alert.runModal() == .alertFirstButtonReturn {
                let p = "\(dir)/dist-desktop"
                if FileManager.default.fileExists(atPath: p) {
                    NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: p)
                }
            }
        }
    }

    // MARK: - Cancel ──────────────────────────────────────────────────────
    @objc func cancelBuild() {
        guard isBuilding else { return }
        buildTask?.cancel()
        currentTask?.terminate()
        isBuilding = false
        setUIBuilding(false)
        for s in stages where s.bar.doubleValue < 100 {
            s.status.stringValue = "⛔  Cancelado"
            s.status.textColor = C.red
        }
        log("\n⛔  Compilación cancelada.\n\n", color: C.red)
    }

    @objc func openFolder() {
        let p = "\(projectDir())/dist-desktop"
        if FileManager.default.fileExists(atPath: p) {
            NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: p)
        } else {
            let a = NSAlert()
            a.messageText = "Carpeta no encontrada"
            a.informativeText = "dist-desktop/ todavía no existe. Realiza al menos una compilación."
            a.runModal()
        }
    }

    @objc func copyDMGPaths() {
        // Also scan for any DMG in dist-desktop if generatedDMGPaths is empty
        var paths = generatedDMGPaths
        if paths.isEmpty {
            let dir = projectDir()
            let found = shellOutput("find '\(dir)/dist-desktop' -name '*.dmg' 2>/dev/null | sort")
            paths = found.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        }

        if paths.isEmpty {
            let a = NSAlert()
            a.messageText = "No hay ejecutables generados"
            a.informativeText = "Realiza al menos una compilación para generar archivos .dmg."
            a.runModal()
            return
        }

        let version = versionField.stringValue.trimmingCharacters(in: .whitespaces)
        var lines = ["DJ Panel Pro v\(version) — Instaladores macOS", ""]
        for path in paths {
            let name = (path as NSString).lastPathComponent
            let size = shellOutput("du -sh '\(path)' 2>/dev/null | cut -f1").trimmingCharacters(in: .whitespaces)
            let icon: String
            if name.contains("arm64")      { icon = "🍎 Apple Silicon" }
            else if name.contains("universal") { icon = "🌐 Universal" }
            else if name.contains("exe") || name.contains("win") { icon = "🪟 Windows" }
            else                           { icon = "🖥️ Intel x64" }
            lines.append("\(icon):\t\(name)  (\(size))\n  Ruta: \(path)")
        }
        lines.append("")
        lines.append("Generado el \(DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short))")

        let text = lines.joined(separator: "\n")
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)

        log("\n📋  Rutas copiadas al portapapeles:\n", color: C.green)
        for p in paths { log("    \(p)\n") }
        log("\n")

        // Brief visual feedback on the button
        let original = copyBtn.title
        copyBtn.title = "  ✅  ¡Copiado!"
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.copyBtn.title = original
        }
    }

    // MARK: - Shell helpers ────────────────────────────────────────────────
    @discardableResult
    func shellRun(_ cmd: String) -> Int32 {
        let t = Process()
        t.executableURL = URL(fileURLWithPath: "/bin/zsh")
        t.arguments = ["-c", cmd]
        try? t.run(); t.waitUntilExit()
        return t.terminationStatus
    }

    func shellOutput(_ cmd: String) -> String {
        let t = Process(); let p = Pipe()
        t.executableURL = URL(fileURLWithPath: "/bin/zsh")
        t.arguments = ["-c", cmd]
        t.standardOutput = p; t.standardError = Pipe()
        try? t.run(); t.waitUntilExit()
        return String(data: p.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
    }

    func streamShell(_ cmd: String, stageIdx: Int, approxLines: Int,
                     minPct: Double = 0, maxPct: Double = 100) -> Bool {
        let t = Process(); let pipe = Pipe()
        t.executableURL = URL(fileURLWithPath: "/bin/zsh")
        t.arguments = ["-c", cmd]
        t.standardOutput = pipe; t.standardError = pipe
        currentTask = t

        var lineCount = 0
        pipe.fileHandleForReading.readabilityHandler = { handle in
            guard let str = String(data: handle.availableData, encoding: .utf8), !str.isEmpty else { return }
            lineCount += str.components(separatedBy: "\n").count - 1
            let ratio  = min(Double(lineCount) / Double(approxLines), 0.95)
            let pct    = minPct + (maxPct - minPct) * ratio
            self.prog(stageIdx, pct)
            DispatchQueue.main.async { self.log(str) }
        }

        try? t.run(); t.waitUntilExit()
        pipe.fileHandleForReading.readabilityHandler = nil
        currentTask = nil
        return buildTask?.isCancelled == false && t.terminationStatus == 0
    }

    var isCancelled: Bool { buildTask?.isCancelled == true }

    // MARK: - Progress & Stage helpers
    func prog(_ idx: Int, _ val: Double) {
        DispatchQueue.main.async {
            guard idx < self.stages.count else { return }
            let v = min(max(val, 0), 100)
            self.stages[idx].bar.doubleValue = v
            self.stages[idx].pct.stringValue = "\(Int(v)) %"
        }
    }

    func startStage(_ idx: Int, msg: String) {
        DispatchQueue.main.async {
            guard idx < self.stages.count else { return }
            self.stages[idx].status.stringValue = "⏳  \(msg)"
            self.stages[idx].status.textColor = C.yellow
        }
    }

    func doneStage(_ idx: Int) {
        DispatchQueue.main.async {
            guard idx < self.stages.count else { return }
            self.stages[idx].bar.doubleValue = 100
            self.stages[idx].pct.stringValue = "100 %"
            self.stages[idx].pct.textColor = C.green
            self.stages[idx].status.stringValue = "✅  Listo"
            self.stages[idx].status.textColor = C.green
        }
    }

    func resetBars() {
        for s in stages {
            s.bar.doubleValue = 0
            s.pct.stringValue = "0 %"
            s.pct.textColor = C.accent
            s.status.stringValue = "Esperando…"
            s.status.textColor = C.dim
        }
    }

    func failBuild(_ reason: String) {
        DispatchQueue.main.async {
            self.isBuilding = false
            self.setUIBuilding(false)
            self.log("\n❌  ERROR: \(reason)\n\n", color: C.red)
            let a = NSAlert()
            a.messageText = "Error de compilación"; a.alertStyle = .critical
            a.informativeText = reason + "\n\nRevisa la consola para más detalles."
            a.addButton(withTitle: "Cerrar")
            a.runModal()
        }
    }

    func setUIBuilding(_ building: Bool) {
        startBtn.isEnabled = !building; cancelBtn.isEnabled = building
        for r in [radioArm64, radioX64, radioUniversal, radioCurrent] { r?.isEnabled = !building }
    }

    // MARK: - Console
    func log(_ text: String, color: NSColor? = nil) {
        DispatchQueue.main.async {
            let attrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.monospacedSystemFont(ofSize: 11, weight: .regular),
                .foregroundColor: color ?? C.termFg
            ]
            self.outputView.textStorage?.append(NSAttributedString(string: text, attributes: attrs))
            self.outputView.scrollToEndOfDocument(nil)
        }
    }

    // MARK: - UI Factory helpers
    @discardableResult
    func lbl(_ text: String, size: CGFloat = 13, bold: Bool = false, color: NSColor = C.text,
             frame: NSRect, in parent: NSView) -> NSTextField {
        let l = NSTextField(labelWithString: text)
        l.font = bold ? .boldSystemFont(ofSize: size) : .systemFont(ofSize: size)
        l.textColor = color; l.frame = frame; parent.addSubview(l); return l
    }

    func cview(_ c: NSColor, frame: NSRect) -> NSView {
        let v = NSView(frame: frame); v.wantsLayer = true; v.layer?.backgroundColor = c.cgColor; return v
    }

    func panel(frame: NSRect) -> NSView {
        let v = cview(C.panel, frame: frame)
        v.layer?.cornerRadius = 12; v.layer?.borderWidth = 1; v.layer?.borderColor = C.border.cgColor; return v
    }

    func sectionTitle(_ text: String, in parent: NSView, yTop: CGFloat) {
        let w = parent.frame.width - 28
        let l = lbl(text, size: 11, bold: true, color: C.accent, frame: NSRect(x: 14, y: yTop - 20, width: w, height: 16), in: parent)
        let _ = l
        let sep = cview(C.border, frame: NSRect(x: 14, y: yTop - 26, width: w, height: 1))
        parent.addSubview(sep)
    }

    func hline(_ view: NSView, w: CGFloat, color: NSColor) {
        let l = cview(color, frame: NSRect(x: 0, y: 0, width: w, height: 1)); view.addSubview(l)
    }

    func projectDir() -> String {
        var url = URL(fileURLWithPath: Bundle.main.bundlePath)
        for _ in 0..<8 {
            if FileManager.default.fileExists(atPath: url.appendingPathComponent("package.json").path) { return url.path }
            url = url.deletingLastPathComponent()
        }
        return FileManager.default.currentDirectoryPath
    }

    func setupMenu() {
        let m = NSMenu(); let item = NSMenuItem(); m.addItem(item)
        let sub = NSMenu(); item.submenu = sub
        sub.addItem(NSMenuItem(title: "Salir de DJ Builder", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        NSApp.mainMenu = m
    }
}

// MARK: - Entry Point
let delegate = AppDelegate()
app.delegate = delegate
app.run()
