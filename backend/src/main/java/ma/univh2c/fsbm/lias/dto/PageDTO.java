package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import org.springframework.data.domain.Page;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageDTO<T> {
    private List<T> contenu;
    private int page;
    private int taille;
    private long totalElements;
    private int totalPages;
    private boolean dernier;

    public static <T> PageDTO<T> from(Page<T> page) {
        return PageDTO.<T>builder()
                .contenu(page.getContent())
                .page(page.getNumber())
                .taille(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .dernier(page.isLast())
                .build();
    }

    public static <T, R> PageDTO<R> from(Page<T> page, List<R> contenu) {
        return PageDTO.<R>builder()
                .contenu(contenu)
                .page(page.getNumber())
                .taille(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .dernier(page.isLast())
                .build();
    }

    public int getNumeroPage() {
        return this.page;
    }

    public int getTaillePage() {
        return this.taille;
    }

    public boolean isEstPremiere() {
        return this.page == 0;
    }

    public boolean isEstDerniere() {
        return this.dernier;
    }
}
