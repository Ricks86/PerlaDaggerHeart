package com.daggerheart.vtt.repository;

import com.daggerheart.vtt.model.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {
    Optional<Card> findByTitulo(String titulo);
    boolean existsByTitulo(String titulo);
}
