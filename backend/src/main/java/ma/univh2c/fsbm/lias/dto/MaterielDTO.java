package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutMateriel;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterielDTO {
    private Long id;
    private String designation;
    private LocalDate dateArrivage;
    private Integer quantiteInitiale;
    private Integer quantiteDisponible;
    private StatutMateriel statut;
}
