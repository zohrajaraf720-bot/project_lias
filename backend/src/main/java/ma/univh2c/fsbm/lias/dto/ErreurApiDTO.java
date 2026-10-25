package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErreurApiDTO {
    private LocalDateTime horodatage;
    private int statut;
    private String code;
    private String message;
    private String chemin;
    private List<ChampErreur> details;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChampErreur {
        private String champ;
        private String message;
    }
}
