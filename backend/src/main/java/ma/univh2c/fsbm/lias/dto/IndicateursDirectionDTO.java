package ma.univh2c.fsbm.lias.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndicateursDirectionDTO {
    private Long adhesionsEnAttente;
    private Long demandesMaterielEnAttente;
    private Long evenementsEnAttente;
    private String etatRapportAnnuel;
}
