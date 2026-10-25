package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "traces_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TraceAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dateAction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAction typeAction;

    @Column(nullable = false)
    private String nomEntite;

    private Long idEntite;

    @Column(columnDefinition = "TEXT")
    private String descriptionDetails;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id")
    private Membre auteur;
}
