package com.daggerheart.vtt.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad principal que representa a un jugador en Daggerheart.
 *
 * Estructura de almacenamiento:
 *  - Atributos y Oro → @Embedded (columnas inline en la misma tabla)
 *  - Experiencias     → @ElementCollection (tabla auxiliar player_character_experiencias)
 *  - InventarioIds    → @ElementCollection (tabla auxiliar player_character_inventario_ids)
 *  - CartasActivasIds → @ElementCollection (tabla auxiliar player_character_cartas_activas_ids)
 */
@Entity
@Table(name = "player_character")
public class PlayerCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // -------------------------------------------------------------------------
    // Identidad narrativa
    // -------------------------------------------------------------------------
    @Column(nullable = false)
    private String nombre;

    private int nivel;
    private String clase;
    private String subclase;
    private String ancestro;
    private String comunidad;

    // -------------------------------------------------------------------------
    // Stats de combate
    // -------------------------------------------------------------------------
    private int competencia;

    private int hpActual;
    private int hpMax;
    private int estresActual;
    private int estresMax;
    private int esperanzaActual;
    private int esperanzaMax;
    private int evasion;

    // -------------------------------------------------------------------------
    // Sub-estructuras embebidas
    // -------------------------------------------------------------------------

    @Embedded
    private Atributos atributos = new Atributos();

    @Embedded
    private Oro oro = new Oro();

    // -------------------------------------------------------------------------
    // Colecciones embebidas
    // -------------------------------------------------------------------------

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "player_character_experiencias",
        joinColumns = @JoinColumn(name = "character_id")
    )
    private List<Experiencia> experiencias = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "player_character_inventario_ids",
        joinColumns = @JoinColumn(name = "character_id")
    )
    @Column(name = "item_id")
    private List<Long> inventarioIds = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "player_character_cartas_activas_ids",
        joinColumns = @JoinColumn(name = "character_id")
    )
    @Column(name = "card_id")
    private List<Long> cartasActivasIds = new ArrayList<>();

    // -------------------------------------------------------------------------
    // Constructores
    // -------------------------------------------------------------------------
    public PlayerCharacter() {}

    // -------------------------------------------------------------------------
    // Getters y Setters
    // -------------------------------------------------------------------------

    public Long getId() { return id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }

    public String getClase() { return clase; }
    public void setClase(String clase) { this.clase = clase; }

    public String getSubclase() { return subclase; }
    public void setSubclase(String subclase) { this.subclase = subclase; }

    public String getAncestro() { return ancestro; }
    public void setAncestro(String ancestro) { this.ancestro = ancestro; }

    public String getComunidad() { return comunidad; }
    public void setComunidad(String comunidad) { this.comunidad = comunidad; }

    public int getCompetencia() { return competencia; }
    public void setCompetencia(int competencia) { this.competencia = competencia; }

    public int getHpActual() { return hpActual; }
    public void setHpActual(int hpActual) { this.hpActual = hpActual; }

    public int getHpMax() { return hpMax; }
    public void setHpMax(int hpMax) { this.hpMax = hpMax; }

    public int getEstresActual() { return estresActual; }
    public void setEstresActual(int estresActual) { this.estresActual = estresActual; }

    public int getEstresMax() { return estresMax; }
    public void setEstresMax(int estresMax) { this.estresMax = estresMax; }

    public int getEsperanzaActual() { return esperanzaActual; }
    public void setEsperanzaActual(int esperanzaActual) { this.esperanzaActual = esperanzaActual; }

    public int getEsperanzaMax() { return esperanzaMax; }
    public void setEsperanzaMax(int esperanzaMax) { this.esperanzaMax = esperanzaMax; }

    public int getEvasion() { return evasion; }
    public void setEvasion(int evasion) { this.evasion = evasion; }

    public Atributos getAtributos() { return atributos; }
    public void setAtributos(Atributos atributos) { this.atributos = atributos; }

    public Oro getOro() { return oro; }
    public void setOro(Oro oro) { this.oro = oro; }

    public List<Experiencia> getExperiencias() { return experiencias; }
    public void setExperiencias(List<Experiencia> experiencias) { this.experiencias = experiencias; }

    public List<Long> getInventarioIds() { return inventarioIds; }
    public void setInventarioIds(List<Long> inventarioIds) { this.inventarioIds = inventarioIds; }

    public List<Long> getCartasActivasIds() { return cartasActivasIds; }
    public void setCartasActivasIds(List<Long> cartasActivasIds) { this.cartasActivasIds = cartasActivasIds; }
}
