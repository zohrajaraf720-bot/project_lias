package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutConvention;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionDetailDTO {
    private Long id;
    private String titre;
    private LocalDate dateSignature;
    private LocalDate dateExpiration;
    private StatutConvention statut;
    private PartenaireDTO partenaire;
    private List<DocumentDTO> documents;
    private List<ActiviteDTO> activites;
    private List<EvenementDTO> evenements;
    private List<PublicationDTO> publications;
}
