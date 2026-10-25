package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutConvention;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConventionDTO {
    private Long id;
    private String titre;
    private LocalDate dateSignature;
    private LocalDate dateExpiration;
    private StatutConvention statut;
    private PartenaireDTO partenaire;
}
