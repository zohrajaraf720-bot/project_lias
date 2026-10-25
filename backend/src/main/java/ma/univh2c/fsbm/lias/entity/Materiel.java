package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutMateriel;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "materiels")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Materiel extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private LocalDate dateArrivage;

    @Column(nullable = false)
    private Integer quantiteInitiale;

    @Column(nullable = false)
    private Integer quantiteDisponible;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutMateriel statut = StatutMateriel.EN_STOCK;

    @Version
    private Long version;

    @OneToMany(mappedBy = "materiel")
    @Builder.Default
    private List<AttributionMateriel> attributions = new ArrayList<>();
}
