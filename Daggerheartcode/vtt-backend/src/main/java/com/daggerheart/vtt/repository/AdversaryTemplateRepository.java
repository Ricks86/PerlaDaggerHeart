package com.daggerheart.vtt.repository;

import com.daggerheart.vtt.model.AdversaryTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdversaryTemplateRepository extends JpaRepository<AdversaryTemplate, Long> {
    Optional<AdversaryTemplate> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
}
