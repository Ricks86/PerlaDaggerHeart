package com.daggerheart.vtt.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Entidad principal que representa a un jugador en Daggerheart.
 *
 * Estructura de almacenamiento:
 *  - Atributos y Oro   → @Embedded
 *  - Experiencias       → @ElementCollection (tabla player_character_experiencias)
 *  - CartasActivasIds   → @ElementCollection (tabla player_character_cartas_activas_ids)
 *  - ArmaPrincipal      → @ManyToOne (Item_Arma)
 *  - ArmaSecundaria     → @ManyToOne (Item_Arma)
 *  - ArmaduraActiva     → @ManyToOne (Item_Armadura)
 *  - Inventario         → @ManyToMany (elementos no equipados: Item polimórfico)
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
    private int ranurasArmaduraMarcadas = 0;
    private boolean puedeSubirNivel = false;

    // -------------------------------------------------------------------------
    // Sub-estructuras embebidas
    // -------------------------------------------------------------------------
    @Embedded
    private Atributos atributos = new Atributos();

    @Embedded
    private Oro oro = new Oro();

    @Embedded
    private TierProgression tierProgression = new TierProgression();

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
        name = "player_character_cartas_activas_ids",
        joinColumns = @JoinColumn(name = "character_id")
    )
    @Column(name = "card_id")
    private List<Long> cartasActivasIds = new ArrayList<>();

    // -------------------------------------------------------------------------
    // Equipamiento activo y polimorfismo de inventario (Sprint 11)
    // -------------------------------------------------------------------------
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "arma_principal_id")
    private Arma armaPrincipal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "arma_secundaria_id")
    private Arma armaSecundaria;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "armadura_activa_id")
    private Armadura armaduraActiva;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "player_character_inventario",
        joinColumns = @JoinColumn(name = "character_id"),
        inverseJoinColumns = @JoinColumn(name = "item_id")
    )
    @OrderColumn(name = "inv_order")
    private List<Item> inventario = new ArrayList<>();

    // -------------------------------------------------------------------------
    // Constructores
    // -------------------------------------------------------------------------
    public PlayerCharacter() {}

    // -------------------------------------------------------------------------
    // Getters y Setters
    // -------------------------------------------------------------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public List<Long> getCartasActivasIds() { return cartasActivasIds; }
    public void setCartasActivasIds(List<Long> cartasActivasIds) { this.cartasActivasIds = cartasActivasIds; }

    public Arma getArmaPrincipal() { return armaPrincipal; }
    public void setArmaPrincipal(Arma armaPrincipal) { this.armaPrincipal = armaPrincipal; }

    public Arma getArmaSecundaria() { return armaSecundaria; }
    public void setArmaSecundaria(Arma armaSecundaria) { this.armaSecundaria = armaSecundaria; }

    public Armadura getArmaduraActiva() { return armaduraActiva; }
    public void setArmaduraActiva(Armadura armaduraActiva) { this.armaduraActiva = armaduraActiva; }

    public List<Item> getInventario() { return inventario; }
    public void setInventario(List<Item> inventario) { this.inventario = inventario; }

    public int getRanurasArmaduraMarcadas() { return ranurasArmaduraMarcadas; }
    public void setRanurasArmaduraMarcadas(int ranurasArmaduraMarcadas) { this.ranurasArmaduraMarcadas = ranurasArmaduraMarcadas; }

    public TierProgression getTierProgression() {
        if (tierProgression == null) {
            tierProgression = new TierProgression();
        }
        return tierProgression;
    }
    public void setTierProgression(TierProgression tierProgression) {
        this.tierProgression = tierProgression;
    }

    public boolean isPuedeSubirNivel() { return puedeSubirNivel; }
    public void setPuedeSubirNivel(boolean puedeSubirNivel) { this.puedeSubirNivel = puedeSubirNivel; }
}
