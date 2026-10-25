package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeEntreeHistorique;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueMembreDTO {
    private Long membreId;
    private List<EntreeHistoriqueDTO> entrees;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntreeHistoriqueDTO {
        private LocalDate date;
        private TypeEntreeHistorique type;
        private String libelle;
    }
}
