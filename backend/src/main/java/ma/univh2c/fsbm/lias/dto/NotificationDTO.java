package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeNotification;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private String titre;
    private String message;
    private TypeNotification type;
    private LocalDateTime dateCreation;
    private Boolean estLue;
    private String lienRedirection;
    private String lienCible;

    public String getLienCible() {
        return (lienCible != null && !lienCible.isBlank()) ? lienCible : lienRedirection;
    }

    public String getLienRedirection() {
        return (lienRedirection != null && !lienRedirection.isBlank()) ? lienRedirection : lienCible;
    }
}
