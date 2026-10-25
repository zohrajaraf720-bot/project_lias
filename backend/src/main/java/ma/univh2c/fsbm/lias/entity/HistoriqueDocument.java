package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String cheminAncienFichier;

    @Column(nullable = false)
    private Integer versionArchivee;

    @Column(nullable = false)
    private LocalDateTime dateModification;

    private Long auteurId;

    private Long tailleFichier;

    private String commentaireModification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
}
